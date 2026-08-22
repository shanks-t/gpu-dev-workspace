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
  description = "Pinned RunPod development image."
  type        = string
  default     = "runpod/pytorch:1.0.7-cu1281-torch291-ubuntu2404"
}

variable "volume_in_gb" {
  description = "Persistent /workspace volume size."
  type        = number
  default     = 50
}

variable "interruptible" {
  description = "Use cheaper interruptible capacity."
  type        = bool
  default     = false
}

resource "runpod_pod" "lab" {
  name              = "gpu-dev-workspace"
  image_name        = var.image_name
  gpu_type_id       = var.gpu_type_id
  gpu_count         = 1
  interruptible     = var.interruptible
  ports             = "22/tcp"
  start_ssh         = true
  volume_in_gb      = var.volume_in_gb
  volume_mount_path = "/workspace"
}

output "pod_id" {
  value = runpod_pod.lab.id
}

output "status" {
  value = runpod_pod.lab.status
}
