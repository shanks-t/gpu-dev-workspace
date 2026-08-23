import torch


def main() -> None:
    if not torch.cuda.is_available():
        raise RuntimeError("PyTorch cannot access CUDA")

    left = torch.arange(16, device="cuda", dtype=torch.float32).reshape(4, 4)
    right = torch.eye(4, device="cuda")
    result = left @ right
    torch.cuda.synchronize()

    if not torch.equal(result, left):
        raise RuntimeError("unexpected CUDA matrix multiplication result")

    print(f"PyTorch CUDA smoke passed on {torch.cuda.get_device_name(0)}")


if __name__ == "__main__":
    main()
