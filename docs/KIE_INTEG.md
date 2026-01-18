/api/v1/jobs/createTask
Create Task

Create a new generation task
Request Parameters

The API accepts a JSON payload with the following structure:
Request Body Structure

{
  "model": "string",
  "callBackUrl": "string (optional)",
  "input": {
    // Input parameters based on form configuration
  }
}

Root Level Parameters
model
Required
string

The model name to use for generation

Example:
"z-image"
callBackUrl
Optional
string

Callback URL for task completion notifications. Optional parameter. If provided, the system will send POST requests to this URL when the task completes (success or failure). If not provided, no callback notifications will be sent.

Example:
"https://your-domain.com/api/callback"
Input Object Parameters

The input object contains the following parameters based on the form configuration:
input.prompt
Required
string

A text description of the image you want to generate

Max length: 1000 characters

Example:
"A hyper-realistic, close-up portrait of a 30-year-old mixed-heritage French-Italian woman drinking coffee from a cup that says “Z-Image × Kie AI.” Natural light. Shot on a Leica M6 with a Kodak Portra 400 film-grain aesthetic."
input.aspect_ratio
Required
string

Aspect ratio for the generated image. Select 'auto' to match the first input image ratio (requires input image).

Available options:
1:1
-1:1
4:3
-4:3
3:4
-3:4
16:9
-16:9
9:16
-9:16

Example:
"1:1"
Request Example

const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    model: 'z-image',
    callBackUrl: 'https://your-domain.com/api/callback',
    input: {
      "prompt": "A hyper-realistic, close-up portrait of a 30-year-old mixed-heritage French-Italian woman drinking coffee from a cup that says “Z-Image × Kie AI.” Natural light. Shot on a Leica M6 with a Kodak Portra 400 film-grain aesthetic.",
      "aspect_ratio": "1:1"
    }
  })
});

const result = await response.json();
console.log(result);

Response Example

{
  "code": 200,
  "message": "success",
  "data": {
    "taskId": "task_12345678"
  }
}

Response Fields
code
Status code, 200 for success, others for failure
message
Response message, error description when failed
data.taskId
Task ID for querying task status
Callback Notifications

When you provide the callBackUrl parameter when creating a task, the system will send POST requests to the specified URL upon task completion (success or failure).
Success Callback Example

{
    "code": 200,
    "data": {
        "completeTime": 1755599644000,
        "costTime": 8,
        "createTime": 1755599634000,
        "model": "z-image",
        "param": "{\"callBackUrl\":\"https://your-domain.com/api/callback\",\"model\":\"z-image\",\"input\":{\"prompt\":\"A hyper-realistic, close-up portrait of a 30-year-old mixed-heritage French-Italian woman drinking coffee from a cup that says “Z-Image × Kie AI.” Natural light. Shot on a Leica M6 with a Kodak Portra 400 film-grain aesthetic.\",\"aspect_ratio\":\"1:1\"}}",
        "resultJson": "{\"resultUrls\":[\"https://example.com/generated-image.jpg\"]}",
        "state": "success",
        "taskId": "e989621f54392584b05867f87b160672",
        "failCode": null,
        "failMsg": null,
    },
    "msg": "Playground task completed successfully."
}

Failure Callback Example

{
    "code": 501,
    "data": {
        "completeTime": 1755597081000,
        "costTime": 0,
        "createTime": 1755596341000,
        "failCode": "500",
        "failMsg": "Internal server error",
        "model": "z-image",
        "param": "{\"callBackUrl\":\"https://your-domain.com/api/callback\",\"model\":\"z-image\",\"input\":{\"prompt\":\"A hyper-realistic, close-up portrait of a 30-year-old mixed-heritage French-Italian woman drinking coffee from a cup that says “Z-Image × Kie AI.” Natural light. Shot on a Leica M6 with a Kodak Portra 400 film-grain aesthetic.\",\"aspect_ratio\":\"1:1\"}}",
        "state": "fail",
        "taskId": "bd3a37c523149e4adf45a3ddb5faf1a8",
        "resultJson": null,
    },
    "msg": "Playground task failed."
}

Important Notes

The callback content structure is identical to the Query Task API response
The param field contains the complete Create Task request parameters, not just the input section
If callBackUrl is not provided, no callback notifications will be sent


--------------------------------------------------------------------------------
-------------------------------------------------------------------------------------
-------------------------------------------------------------------------------------


/api/v1/jobs/recordInfo
Query Task

Query task status and results by task ID
Request Example

const response = await fetch('https://api.kie.ai/api/v1/jobs/recordInfo?taskId=task_12345678', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
});

const result = await response.json();
console.log(result);

Response Example

{
  "code": 200,
  "message": "success",
  "data": {
    "taskId": "task_12345678",
    "model": "z-image",
    "state": "success",
    "param": "{\"model\":\"z-image\",\"callBackUrl\":\"https://your-domain.com/api/callback\",\"input\":{\"prompt\":\"A hyper-realistic, close-up portrait of a 30-year-old mixed-heritage French-Italian woman drinking coffee from a cup that says “Z-Image × Kie AI.” Natural light. Shot on a Leica M6 with a Kodak Portra 400 film-grain aesthetic.\",\"aspect_ratio\":\"1:1\"}}",
    "resultJson": "{\"resultUrls\":[\"https://example.com/generated-image.jpg\"]}",
    "failCode": "",
    "failMsg": "",
    "costTime": 0,
    "completeTime": 1698765432000,
    "createTime": 1698765400000
  }
}

Response Fields
code
Status code, 200 for success, others for failure
message
Response message, error description when failed
data.taskId
Task ID
data.model
Model used for generation
data.state
Generation state
data.param
Complete Create Task request parameters as JSON string (includes model, callBackUrl, input and all other parameters)
data.resultJson
Result JSON string containing generated media URLs
data.failCode
Error code (when generation failed)
data.failMsg
Error message (when generation failed)
data.completeTime
Completion timestamp
data.createTime
Creation timestamp
data.costTime
Cost time in milliseconds
State Values
waiting
Waiting for generation
queuing
In queue
generating
Generating
success
Generation successful
fail
Generation failed