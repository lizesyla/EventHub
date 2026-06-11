from fastapi import FastAPI

app = FastAPI(title="EventHub API", version="1.0.0")

@app.get("/")
def read_root():
    return {"message": "Mirësevini në EventHub API!"}