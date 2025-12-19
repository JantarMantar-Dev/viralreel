import asyncio
import httpx
import sys
import json

API_URL = "http://localhost:8000/api/v1"

async def main():
    async with httpx.AsyncClient(timeout=30.0) as client:
        print(f"Connecting to {API_URL}...")
        
        # 1. Create Group
        group_payload = {
            "name": "Docker Test Group",
            "type": "SINGLE",
            "user_id": "docker_tester",
            "description": "Automated test group"
        }
        resp = await client.post(f"{API_URL}/groups", json=group_payload)
        if resp.status_code != 201:
            print(f"Failed to create group: {resp.text}")
            sys.exit(1)
        
        group = resp.json()
        group_id = group["id"]
        print(f"Created Group: {group_id}")
        
        # 2. Create Item (Trigger Job)
        item_payload = {
            "group_id": group_id,
            "title": "Docker Test Video",
            "auto_render": True,
            "metadata": {
                "master_prompt": "A futuristic cyberpunk city with neon lights",
                "platform": "TIKTOK",
                "duration_category": "SHORT",
                "aspect_ratio": "9:16",
                "script_payload": {
                    "sections": [
                        {
                            "text": "This is a test of the docker pipeline.",
                            "image_prompt": "A robot checking docker logs"
                        },
                        {
                            "text": "Section 2: Scaling the infrastructure.",
                            "image_prompt": "Servers stacking up in a data center"
                        },
                        {
                            "text": "Section 3: Connecting to the world.",
                            "image_prompt": "Digital globe with network connections"
                        },
                        {
                            "text": "Section 4: Deployment complete.",
                            "image_prompt": "Green success checkmark on a screen"
                        }
                    ]
                }
            }
        }
        
        print("Creating Item and Triggering Job...")
        resp = await client.post(f"{API_URL}/items", json=item_payload)
        if resp.status_code != 201:
            print(f"Failed to create item: {resp.text}")
            sys.exit(1)
            
        item = resp.json()
        job = item.get("latest_job")
        if not job:
            print("No job created!")
            sys.exit(1)
            
        job_id = job["id"]
        print(f"Job Queued: {job_id}")
        
        # 3. Poll Status
        print("Polling Job Status...")
        while True:
            resp = await client.get(f"{API_URL}/jobs/{job_id}")
            if resp.status_code != 200:
                print(f"Error checking job: {resp.text}")
                break
            
            job_status = resp.json()
            status = job_status["status"]
            print(f"Status: {status}")
            
            if status in ["COMPLETED", "FAILED"]:
                print(f"Final Status: {status}")
                if status == "COMPLETED":
                    print(f"Output URL: {job_status.get('output_url')}")
                else:
                    print(f"Error Message: {job_status.get('error_message')}")
                break
            
            await asyncio.sleep(2)

if __name__ == "__main__":
    asyncio.run(main())
