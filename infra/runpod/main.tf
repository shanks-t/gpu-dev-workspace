terraform {
  required_version = ">= 1.8"
  required_providers {
    runpod = {
      source = "runpod/runpod"
      # 1.0.9 publishes an invalid endpoint_workers schema and cannot load.
      version = "= 1.0.8"
    }
  }
}

provider "runpod" {}

variable "gpu_type_id" {
  description = "RunPod GPU type ID from the console or gpu_types data source."
  type        = string
  default     = "NVIDIA GeForce RTX 3090"
}

variable "image_name" {
  description = "Pinned CUDA 13.0 and PyTorch 2.9.1 RunPod development image."
  type        = string
  default     = "runpod/pytorch:1.1.0-cu1300-torch291-ubuntu2404"
}

variable "cloud_type" {
  description = "RunPod cloud tier. Community is the cheapest default for public book exercises."
  type        = string
  default     = "COMMUNITY"
  validation {
    condition     = contains(["COMMUNITY", "SECURE", "ALL"], var.cloud_type)
    error_message = "cloud_type must be COMMUNITY, SECURE, or ALL."
  }
}

variable "container_disk_in_gb" {
  description = "Ephemeral OS and image disk; its contents are lost when the Pod stops."
  type        = number
  default     = 40
  validation {
    condition     = var.container_disk_in_gb >= 40
    error_message = "container_disk_in_gb must be at least 40 GB for the CUDA 13 development image."
  }
}

variable "volume_in_gb" {
  description = "Persistent /workspace volume for source, virtual environments, caches, profiles, and small datasets."
  type        = number
  default     = 50
  validation {
    condition     = var.volume_in_gb >= 50
    error_message = "volume_in_gb must be at least 50 GB for the book workspace and profiling artifacts."
  }
}

variable "interruptible" {
  description = "Use cheaper interruptible capacity."
  type        = bool
  default     = false
}

resource "runpod_pod" "lab" {
  name                 = "gpu-dev-workspace"
  image_name           = var.image_name
  cloud_type           = var.cloud_type
  gpu_type_id          = var.gpu_type_id
  gpu_count            = 1
  interruptible        = var.interruptible
  container_disk_in_gb = var.container_disk_in_gb
  ports                = "22/tcp"
  start_ssh            = true
  volume_in_gb         = var.volume_in_gb
  volume_mount_path    = "/workspace"
  env = [
    "HF_HOME=/workspace/.cache/huggingface",
    "TORCH_HOME=/workspace/.cache/torch",
    "TRITON_CACHE_DIR=/workspace/.cache/triton",
    "XDG_CACHE_HOME=/workspace/.cache",
  ]
}

output "pod_id" {
  value = runpod_pod.lab.id
}

output "status" {
  value = runpod_pod.lab.status
}
