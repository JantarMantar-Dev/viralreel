from typing import Any, Dict, Optional
from enum import Enum

class ErrorCode(str, Enum):
    # Generic
    INTERNAL_ERROR = "INTERNAL_ERROR"
    VALIDATION_ERROR = "VALIDATION_ERROR"
    NOT_FOUND = "NOT_FOUND"
    
    # Business Logic
    INVALID_OPERATION = "INVALID_OPERATION"
    RESOURCE_ALREADY_EXISTS = "RESOURCE_ALREADY_EXISTS"
    
    # Auth
    UNAUTHORIZED = "UNAUTHORIZED"
    FORBIDDEN = "FORBIDDEN"

    # Job/Video Specific
    GENERATION_FAILED = "GENERATION_FAILED"
    QUOTA_EXCEEDED = "QUOTA_EXCEEDED"

class AppError(Exception):
    """Base class for application exceptions."""
    def __init__(
        self, 
        message: str, 
        code: ErrorCode = ErrorCode.INTERNAL_ERROR, 
        status_code: int = 500,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)

class ResourceNotFoundError(AppError):
    def __init__(self, resource: str, identifier: Any):
        super().__init__(
            message=f"{resource} with identifier {identifier} not found.",
            code=ErrorCode.NOT_FOUND,
            status_code=404,
            details={"resource": resource, "identifier": str(identifier)}
        )

class ResourceAlreadyExistsError(AppError):
    def __init__(self, resource: str, field: str, value: Any):
        super().__init__(
            message=f"{resource} with {field}={value} already exists.",
            code=ErrorCode.RESOURCE_ALREADY_EXISTS,
            status_code=409,
            details={"resource": resource, "field": field, "value": str(value)}
        )

class BusinessRuleViolationError(AppError):
    def __init__(self, message: str, details: Optional[Dict] = None):
        super().__init__(
            message=message,
            code=ErrorCode.INVALID_OPERATION,
            status_code=400,
            details=details
        )
