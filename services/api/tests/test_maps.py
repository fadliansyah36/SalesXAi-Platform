import json
import unittest
from io import BytesIO
from unittest.mock import patch
from urllib.error import HTTPError

from app.errors import APIError
from app.routers.maps import MapPlacesSearchRequest, _google_places_search


class _FakeResponse:
    def __init__(self, body):
        self.body = json.dumps(body).encode("utf-8")

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def read(self):
        return self.body


class GooglePlacesAdapterTests(unittest.TestCase):
    def test_places_request_supports_legacy_camel_case_and_server_key(self):
        payload = MapPlacesSearchRequest.model_validate({
            "textQuery": "apotek terdekat",
            "includedType": "pharmacy",
            "strictTypeFiltering": True,
            "locationBias": {"lat": -6.2, "lng": 106.8, "radiusMeters": 12000},
            "pageSize": 8,
            "pageToken": "next-page",
        })
        provider_response = {
            "places": [{"id": "fixture-place", "formattedAddress": "Fixture address"}],
            "nextPageToken": "next-page-2",
        }
        with patch("app.routers.maps.urlopen", return_value=_FakeResponse(provider_response)) as open_url:
            result = _google_places_search(payload, "server-only-test-key", "id", "ID")

        request = open_url.call_args.args[0]
        body = json.loads(request.data.decode("utf-8"))
        self.assertEqual(request.full_url, "https://places.googleapis.com/v1/places:searchText")
        self.assertEqual(request.get_header("X-goog-api-key"), "server-only-test-key")
        self.assertEqual(body["textQuery"], "apotek terdekat")
        self.assertEqual(body["includedType"], "pharmacy")
        self.assertTrue(body["strictTypeFiltering"])
        self.assertEqual(body["locationBias"]["circle"]["radius"], 12000)
        self.assertEqual(body["pageSize"], 8)
        self.assertEqual(body["pageToken"], "next-page")
        self.assertEqual(result["places"][0]["id"], "fixture-place")
        self.assertEqual(result["nextPageToken"], "next-page-2")

    def test_places_quota_errors_are_classified(self):
        payload = MapPlacesSearchRequest(text_query="toko obat")
        error = HTTPError(
            "https://places.googleapis.com/v1/places:searchText",
            429,
            "quota",
            {},
            BytesIO(b'{"error":{"status":"RESOURCE_EXHAUSTED"}}'),
        )
        with patch("app.routers.maps.urlopen", side_effect=error):
            with self.assertRaises(APIError) as caught:
                _google_places_search(payload, "server-only-test-key", "id", "ID")
        self.assertEqual(caught.exception.status_code, 429)
        self.assertEqual(caught.exception.code, "maps_places_quota_exceeded")

    def test_places_query_and_coordinates_are_validated(self):
        with self.assertRaises(ValueError):
            MapPlacesSearchRequest(text_query="   ")
        with self.assertRaises(ValueError):
            MapPlacesSearchRequest(
                text_query="coffee",
                location_bias={"lat": 91, "lng": 106.8},
            )
        with self.assertRaises(ValueError):
            MapPlacesSearchRequest(text_query="coffee", page_size=21)


if __name__ == "__main__":
    unittest.main()
