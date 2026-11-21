from __future__ import annotations

import asyncio
import json
import os
from typing import Literal
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.errors import APIError
from app.security.dependencies import TenantContext, require_api_action

router = APIRouter(tags=["maps"])


class MapCoordinate(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)


class MapRouteComputeRequest(BaseModel):
    origin: MapCoordinate
    destination: MapCoordinate
    intermediates: list[MapCoordinate] = Field(default_factory=list, max_length=25)
    travel_mode: Literal["DRIVE", "BICYCLE", "WALK", "TWO_WHEELER"] = "DRIVE"


def _google_route(payload: MapRouteComputeRequest, api_key: str) -> dict:
    body: dict = {
        "origin": {"location": {"latLng": {"latitude": payload.origin.lat, "longitude": payload.origin.lng}}},
        "destination": {"location": {"latLng": {"latitude": payload.destination.lat, "longitude": payload.destination.lng}}},
        "travelMode": payload.travel_mode,
        "polylineQuality": "OVERVIEW",
    }
    if payload.intermediates:
        body["intermediates"] = [
            {"location": {"latLng": {"latitude": point.lat, "longitude": point.lng}}}
            for point in payload.intermediates
        ]
    request = Request(
        "https://routes.googleapis.com/directions/v2:computeRoutes",
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "X-Goog-Api-Key": api_key,
            "X-Goog-FieldMask": "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline",
        },
        method="POST",
    )
    try:
        with urlopen(request, timeout=12) as response:
            result = json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        raise APIError(502, "maps_provider_error", "Google Routes API rejected the route request.") from exc
    except (URLError, TimeoutError, OSError, ValueError) as exc:
        raise APIError(502, "maps_provider_unavailable", "Google Routes API is temporarily unavailable.") from exc
    routes = result.get("routes") or []
    if not routes:
        raise APIError(404, "maps_route_not_found", "No route is available for the supplied coordinates.")
    route = routes[0]
    encoded = (route.get("polyline") or {}).get("encodedPolyline")
    if not encoded:
        raise APIError(502, "maps_route_response_invalid", "Google Routes API returned no route geometry.")
    return {
        "provider": "google",
        "distance_m": int(route.get("distanceMeters") or 0),
        "duration": str(route.get("duration") or ""),
        "encoded_polyline": encoded,
    }


@router.get("/maps/config")
async def maps_config(tenant: TenantContext = Depends(require_api_action("maps.config.read")):
    del tenant
    return {
        "provider": "google" if os.getenv("MAPS_PROVIDER", "google").strip().lower() == "google" else "none",
        "server_routes_enabled": bool(os.getenv("GOOGLE_MAPS_SERVER_API_KEY")),
        "language": os.getenv("GOOGLE_MAPS_LANGUAGE", "id"),
        "region": os.getenv("GOOGLE_MAPS_REGION", "ID"),
    }


@router.post("/organizations/{organization_id}/maps/routes/compute")
async def compute_route(
    organization_id: UUID,
    payload: MapRouteComputeRequest,
    tenant: TenantContext = Depends(require_api_action("maps.routes.compute")),
):
    del principal
    if tenant.organization_id != organization_id:
        raise APIError(403, "tenant_scope_mismatch", "Map route access is restricted to the active organization.")
    api_key = os.getenv("GOOGLE_MAPS_SERVER_API_KEY", "").strip()
    if not api_key:
        raise APIError(503, "maps_provider_not_configured", "Google Maps server route credentials are not configured.")
    return await asyncio.to_thread(_google_route, payload, api_key)
