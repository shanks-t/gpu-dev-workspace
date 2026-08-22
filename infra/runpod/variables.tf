variable "cloud_type" {
  description = "RunPod cloud tier used for the workspace."
  type        = string
  validation {
    condition     = contains(["COMMUNITY", "SECURE", "ALL"], var.cloud_type)
    error_message = "cloud_type must be COMMUNITY, SECURE, or ALL."
  }
}

variable "container_disk_in_gb" {
  description = "Ephemeral OS, image, and workspace disk size in GB."
  type        = number
  validation {
    condition     = var.container_disk_in_gb >= 40
    error_message = "container_disk_in_gb must be at least 40 GB for the CUDA development image."
  }
}

variable "gpu_count" {
  description = "Number of GPUs assigned to the Pod."
  type        = number
  validation {
    condition     = var.gpu_count >= 1
    error_message = "gpu_count must be at least one."
  }
}

variable "gpu_type_id" {
  description = "RunPod GPU type ID selected by the workload profile."
  type        = string
}

variable "image_name" {
  description = "Pinned RunPod development image containing the required CUDA toolchain."
  type        = string
}

variable "interruptible" {
  description = "Whether to use cheaper interruptible capacity."
  type        = bool
}

variable "persistent_storage" {
  description = "Whether to create a persistent Pod volume mounted at /workspace."
  type        = bool
}

variable "profile_name" {
  description = "Name of the declarative workload profile selected by the CLI."
  type        = string
}

variable "volume_in_gb" {
  description = "Persistent /workspace volume size in GB when persistence is enabled."
  type        = number
  validation {
    condition     = var.volume_in_gb >= 50
    error_message = "volume_in_gb must be at least 50 GB for book artifacts."
  }
}
