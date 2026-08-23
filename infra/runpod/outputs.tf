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
  description = "Image or provider-template identity selected by the workload profile."
  value       = var.image_name
}

output "profile_name" {
  description = "Name of the profile that created the managed workspace."
  value       = var.profile_name
}

output "retained_storage_cost_usd_per_month" {
  description = "Profile's current estimate of monthly charges after retained compute is stopped."
  value       = var.retained_storage_cost_usd_per_month
}

output "status" {
  description = "Current RunPod Pod status reported by the provider."
  value       = runpod_pod.lab.status
}

output "template_id" {
  description = "Provider-owned or Terraform-managed template identifier used by the Pod."
  value       = var.runpod_template_id != "" ? var.runpod_template_id : runpod_template.lab[0].id
}

output "template_ownership" {
  description = "Whether the selected template is owned by RunPod or Terraform."
  value       = var.runpod_template_id != "" ? "provider" : "terraform"
}

output "validation_mode" {
  description = "GPU readiness check selected by the workload profile."
  value       = var.validation_mode
}
