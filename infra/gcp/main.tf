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
  machine_type   = var.machine_type
  zone           = var.zone
  desired_status = var.desired_status
  tags           = ["gpu-dev-workspace"]

  boot_disk {
    auto_delete = var.boot_disk_auto_delete
    initialize_params {
      image = var.boot_disk_image
      size  = var.boot_disk_size_gb
      type  = var.boot_disk_type
    }
  }

  guest_accelerator {
    type  = var.accelerator_type
    count = var.accelerator_count
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
