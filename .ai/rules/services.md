---
paths:
  - app/Services/DocumentRequestService.php
---

# Services

## Service::submit() must explicitly list every column
DocumentRequestService::submit() manually builds the create() array — it does NOT use mass-assignment from $data. Any new column added to document_requests must also be added to the create() call inside submit() or it will silently be ignored. Example: dssc_organization_id was added to the model fillable and validated by the controller, but was lost until the service was updated.
