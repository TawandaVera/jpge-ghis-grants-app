# Workspace roles

Recommended access roles for production deployment.

## Admin

Can manage users, workspaces, organization profile, security settings, and export policies.

## Grant lead

Can run discovery, score opportunities, approve applications for pipeline movement, and approve final pack readiness.

## Writer

Can manage narrative blocks and draft proposal sections. Cannot export final packs unless also assigned reviewer or grant lead privileges.

## Reviewer

Can verify source evidence, approve or reject HIL checkpoints, and approve proposal sections for export.

## Viewer

Can view dashboards, pipeline status, and approved records. Cannot create, update, score, draft, or export.

## Route guidance

- `/admin/workspaces`: Admin only.
- `/org-profile`: Admin or grant lead.
- `/discovery`: Grant lead.
- `/assessment`: Grant lead or reviewer.
- `/pipeline`: Grant lead, reviewer, writer with limited stage permissions.
- `/copilot`: Writer, reviewer, grant lead.
- `/pack`: Reviewer or grant lead only after gates pass.
