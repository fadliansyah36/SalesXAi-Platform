from datetime import UTC, datetime
import unittest
from pydantic import ValidationError
from app.schemas.location import LocationPointWrite, LocationPointBatch, LocationSessionStart, LocationGeofenceWrite

class TestLocationContracts(unittest.TestCase):
    def test_location_coordinates_are_bounded(self):
        with self.assertRaises(ValidationError):
            LocationPointWrite(client_point_id="point-1234",recorded_at=datetime.now(UTC),latitude=91,longitude=0,accuracy_m=5)
        with self.assertRaises(ValidationError):
            LocationPointWrite(client_point_id="point-1234",recorded_at=datetime.now(UTC),latitude=0,longitude=181,accuracy_m=5)

    def test_location_batch_is_bounded(self):
        point=LocationPointWrite(client_point_id="point-1234",recorded_at=datetime.now(UTC),latitude=-6.2,longitude=106.8,accuracy_m=12)
        with self.assertRaises(ValidationError):
            LocationPointBatch(points=[point]*501)

    def test_location_session_requires_consent_policy(self):
        with self.assertRaises(ValidationError):
            LocationSessionStart(device_id="device-1234",consent_policy_version="")

    def test_geofence_requires_geojson_polygon_and_consistent_reference(self):
        with self.assertRaises(ValidationError):
            LocationGeofenceWrite(code="A1",name="Outlet",geofence_type="outlet",outlet_id=None,boundary_geojson={"type":"Point"})

if __name__ == "__main__":
    unittest.main()
