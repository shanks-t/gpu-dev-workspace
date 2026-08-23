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
    condition     = var.container_disk_in_gb >= 30
    error_message = "container_disk_in_gb must be at least 30 GB."
  }
}

variable "validation_mode" {
  description = "Profile-specific GPU readiness check run by the CLI after SSH is available."
  type        = string
  validation {
    condition = contains([
      "cuda",
      "fundamentals",
      "pytorch",
      "nvidia-performance",
      "performance-full",
    ], var.validation_mode)
    error_message = "validation_mode must be cuda, fundamentals, pytorch, nvidia-performance, or performance-full."
  }
}

variable "container_registry_auth_id" {
  description = "Optional RunPod container registry credential ID required when the GHCR image is private."
  type        = string
  default     = ""
  nullable    = false
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
  description = "Immutable image reference, or the provider-template identity when runpod_template_id is set."
  type        = string
  validation {
    condition = var.runpod_template_id != "" || can(regex(
      "^(?:ghcr\\.io/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+:(?:[0-9]+\\.[0-9]+\\.[0-9]+|sha-[0-9a-f]{40})|ghcr\\.io/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+@sha256:[0-9a-f]{64}|runpod/[A-Za-z0-9_.-]+@sha256:[0-9a-f]{64})$",
      var.image_name,
    ))
    error_message = "image_name must be an approved immutable image reference unless runpod_template_id selects a provider-owned template."
  }
}

variable "runpod_template_id" {
  description = "Existing RunPod template ID. When set, Terraform creates only the Pod and never manages that template."
  type        = string
  default     = ""
  nullable    = false
  validation {
    condition     = var.runpod_template_id == "" || can(regex("^[A-Za-z0-9_-]+$", var.runpod_template_id))
    error_message = "runpod_template_id must be empty or a RunPod template ID."
  }
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

variable "retained_storage_cost_usd_per_month" {
  description = "Estimated monthly charge for storage retained after compute stops; set per persistent profile from current provider pricing."
  type        = number
  default     = 0
  validation {
    condition     = var.retained_storage_cost_usd_per_month >= 0
    error_message = "retained_storage_cost_usd_per_month must be non-negative."
  }
}

variable "volume_in_gb" {
  description = "Persistent /workspace volume size in GB when persistence is enabled."
  type        = number
  validation {
    condition     = var.volume_in_gb >= 50
    error_message = "volume_in_gb must be at least 50 GB for book artifacts."
  }
}
