from fastapi import FastAPI
from reel import generate_reel

app = FastAPI()

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.post("/generate-reel")
def create_reel():
    output_path = generate_reel()
    return {"message": "Video generated successfully", "path": output_path}

