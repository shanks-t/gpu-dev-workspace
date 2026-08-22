output "down_action" {
  description = "Lifecycle action the CLI performs for this profile."
  value       = var.persistent_storage ? "stop" : "destroy"
}

output "instance_name" {
  description = "Name of the managed GCP VM."
  value       = google_compute_instance.lab.name
}

output "persistent_storage" {
  description = "Whether the workspace is retained when compute stops."
  value       = var.persistent_storage
}

output "profile_name" {
  description = "Name of the profile that created the managed workspace."
  value       = var.profile_name
}

output "public_ip" {
  description = "Ephemeral public IPv4 address used for SSH."
  value       = google_compute_instance.lab.network_interface[0].access_config[0].nat_ip
}

output "ssh_user" {
  description = "Linux username used for SSH access."
  value       = var.ssh_user
}

output "status" {
  description = "Current VM status reported by GCP."
  value       = google_compute_instance.lab.current_status
}
