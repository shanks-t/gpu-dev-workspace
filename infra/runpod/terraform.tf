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
