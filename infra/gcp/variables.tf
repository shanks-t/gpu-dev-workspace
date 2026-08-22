variable "accelerator_count" {
  description = "Number of GPUs attached to the VM."
  type        = number
  validation {
    condition     = var.accelerator_count >= 1
    error_message = "accelerator_count must be at least one."
  }
}

variable "accelerator_type" {
  description = "GCP accelerator type selected by the workload profile."
  type        = string
}

variable "boot_disk_auto_delete" {
  description = "Whether cleanup deletes the boot disk with the VM."
  type        = bool
}

variable "boot_disk_image" {
  description = "Pinned Deep Learning VM image for the workspace."
  type        = string
}

variable "boot_disk_size_gb" {
  description = "Boot disk size in GB."
  type        = number
  validation {
    condition     = var.boot_disk_size_gb >= 40
    error_message = "boot_disk_size_gb must be at least 40 GB."
  }
}

variable "boot_disk_type" {
  description = "GCP boot disk type."
  type        = string
}

variable "desired_status" {
  description = "Operational VM state managed by the CLI."
  type        = string
  default     = "RUNNING"
  validation {
    condition     = contains(["RUNNING", "TERMINATED"], var.desired_status)
    error_message = "desired_status must be RUNNING or TERMINATED."
  }
}

variable "machine_type" {
  description = "GCP machine type hosting the GPU."
  type        = string
}

variable "persistent_storage" {
  description = "Whether gpu down stops the VM and preserves its boot disk."
  type        = bool
}

variable "profile_name" {
  description = "Name of the declarative workload profile selected by the CLI."
  type        = string
}

variable "project_id" {
  description = "GCP project with billing, Compute Engine, and GPU quota enabled."
  type        = string
}

variable "region" {
  description = "GCP region containing the workspace."
  type        = string
  default     = "us-west1"
}

variable "spot" {
  description = "Whether to use cheaper Spot capacity."
  type        = bool
}

variable "ssh_public_key" {
  description = "Complete OpenSSH public key line installed on the VM."
  type        = string
}

variable "ssh_source_cidr" {
  description = "Public source IPv4 CIDR allowed to connect over SSH."
  type        = string
  validation {
    condition     = var.ssh_source_cidr != "0.0.0.0/0"
    error_message = "ssh_source_cidr must not expose SSH to the entire internet."
  }
}

variable "ssh_user" {
  description = "Linux username used for SSH access."
  type        = string
  default     = "gpu-dev"
}

variable "zone" {
  description = "GCP zone containing the VM and accelerator."
  type        = string
  default     = "us-west1-b"
}
