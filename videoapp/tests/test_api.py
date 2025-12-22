import pytest
from httpx import AsyncClient, ASGITransport
from src.main import app
from src.database import get_db
import src.schemas as schemas

@pytest.mark.asyncio
async def test_api_flow(db_session):
    # Override dependency to use the test db session
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Test Create Group
        response = await ac.post("/api/v1/groups", json={
            "name": "API Test Series",
            "type": "SERIES",
            "user_id": "test_user",
            "description": "Created via API"
        })
        assert response.status_code == 201
        group_data = response.json()
        assert group_data["name"] == "API Test Series"
        group_id = group_data["id"]
        
        # 2. Test Create Item with Job
        item_payload = {
            "group_id": group_id,
            "title": "API Episode 1",
            "auto_render": True,
            "metadata": {
                "master_prompt": "An api story",
                "platform": "TIKTOK",
                "duration_category": "SHORT",
                "script_payload": {"test": "data"}
            }
        }
        response = await ac.post("/api/v1/items", json=item_payload)
        assert response.status_code == 201
        item_data = response.json()
        assert item_data["title"] == "API Episode 1"
        assert item_data["latest_job"]["status"] == "QUEUED"
        job_id = item_data["latest_job"]["id"]
        
        # 3. Test Get Job Status
        response = await ac.get(f"/api/v1/jobs/{job_id}")
        assert response.status_code == 200
        assert response.json()["status"] == "QUEUED"

        # 4. Test List Niches (Empty initially, but should return 200 list)
        response = await ac.get("/api/v1/niches")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

        # 5. Test Error Handling (Not Found)
        import uuid
        random_id = str(uuid.uuid4())
        response = await ac.get(f"/api/v1/jobs/{random_id}")
        assert response.status_code == 404
        error_data = response.json()
        assert error_data["error"] is True
        assert error_data["code"] == "NOT_FOUND"
        assert "VideoJob" in error_data["message"]
        
    app.dependency_overrides = {}
