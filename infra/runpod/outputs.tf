output "down_action" {
  description = "Lifecycle action the CLI performs for this profile."
  value       = var.persistent_storage ? "stop" : "destroy"
}

output "persistent_storage" {
  description = "Whether the workspace uses billable persistent storage."
  value       = var.persistent_storage
}

output "pod_id" {
  description = "RunPod Pod identifier used by the CLI and REST API."
  value       = runpod_pod.lab.id
}

output "image_name" {
  description = "Immutable development image selected by the workload profile."
  value       = runpod_template.lab.image_name
}

output "profile_name" {
  description = "Name of the profile that created the managed workspace."
  value       = var.profile_name
}

output "status" {
  description = "Current RunPod Pod status reported by the provider."
  value       = runpod_pod.lab.status
}

output "template_id" {
  description = "Terraform-managed private RunPod template identifier."
  value       = runpod_template.lab.id
}

output "validation_mode" {
  description = "GPU readiness check selected by the workload profile."
  value       = var.validation_mode
}
