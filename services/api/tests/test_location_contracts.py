from datetime import UTC, datetime
import pytest
from pydantic import ValidationError
from app.schemas.location import LocationPointWrite, LocationPointBatch, LocationSessionStart, LocationGeofenceWrite

def test_location_coordinates_are_bounded():
    with pytest.raises(ValidationError):
        LocationPointWrite(client_point_id="point-1234",recorded_at=datetime.now(UTC),latitude=91,longitude=0,accuracy_m=5)
    with pytest.raises(ValidationError):
        LocationPointWrite(client_point_id="point-1234",recorded_at=datetime.now(UTC),latitude=0,longitude=181,accuracy_m=5)

def test_location_batch_is_bounded():
    point=LocationPointWrite(client_point_id="point-1234",recorded_at=datetime.now(UTC),latitude=-6.2,longitude=106.8,accuracy_m=12)
    with pytest.raises(ValidationError):
        LocationPointBatch(points=[point]*501)

def test_location_session_requires_consent_policy():
    with pytest.raises(ValidationError):
        LocationSessionStart(device_id="device-1234",consent_policy_version="")

def test_geofence_requires_geojson_polygon_and_consistent_reference():
    with pytest.raises(ValidationError):
        LocationGeofenceWrite(code="A1",name="Outlet",geofence_type="outlet",outlet_id=None,boundary_geojson={"type":"Point"})
