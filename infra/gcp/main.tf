terraform {
  required_version = ">= 1.8"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 7.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

variable "project_id" {
  description = "GCP project with billing, Compute Engine, and T4 quota enabled."
  type        = string
}

variable "region" {
  type    = string
  default = "us-west1"
}

variable "zone" {
  type    = string
  default = "us-west1-b"
}

variable "ssh_user" {
  type    = string
  default = "gpu-dev"
}

variable "ssh_public_key" {
  description = "One complete OpenSSH public key line."
  type        = string
}

variable "ssh_source_cidr" {
  description = "Your public IP as a /32; do not use 0.0.0.0/0."
  type        = string
}

variable "desired_status" {
  type    = string
  default = "RUNNING"
  validation {
    condition     = contains(["RUNNING", "TERMINATED"], var.desired_status)
    error_message = "desired_status must be RUNNING or TERMINATED."
  }
}

variable "spot" {
  description = "Use cheaper Spot capacity; the persistent boot disk survives preemption."
  type        = bool
  default     = true
}

resource "google_compute_network" "lab" {
  name                    = "gpu-dev-workspace"
  auto_create_subnetworks = true
}

resource "google_compute_firewall" "ssh" {
  name          = "gpu-dev-workspace-ssh"
  network       = google_compute_network.lab.name
  source_ranges = [var.ssh_source_cidr]
  target_tags   = ["gpu-dev-workspace"]

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }
}

resource "google_compute_instance" "lab" {
  name           = "gpu-dev-workspace"
  machine_type   = "n1-standard-4"
  zone           = var.zone
  desired_status = var.desired_status
  tags           = ["gpu-dev-workspace"]

  boot_disk {
    initialize_params {
      image = "deeplearning-platform-release/pytorch-2-9-cu129-ubuntu-2404-nvidia-580-v20260819"
      size  = 100
      type  = "pd-standard"
    }
  }

  guest_accelerator {
    type  = "nvidia-tesla-t4"
    count = 1
  }

  scheduling {
    automatic_restart           = false
    on_host_maintenance         = "TERMINATE"
    preemptible                 = var.spot
    provisioning_model          = var.spot ? "SPOT" : "STANDARD"
    instance_termination_action = var.spot ? "STOP" : null
  }

  metadata = {
    block-project-ssh-keys = "true"
    ssh-keys               = "${var.ssh_user}:${var.ssh_public_key}"
  }

  network_interface {
    network = google_compute_network.lab.id
    access_config {}
  }
}

output "instance_name" {
  value = google_compute_instance.lab.name
}

output "public_ip" {
  value = google_compute_instance.lab.network_interface[0].access_config[0].nat_ip
}

output "ssh_user" {
  value = var.ssh_user
}

output "status" {
  value = google_compute_instance.lab.current_status
}
