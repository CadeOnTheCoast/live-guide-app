import { KeyResultStatus } from "@prisma/client";

export function getNextKeyResultStatus(status: KeyResultStatus): KeyResultStatus {
  switch (status) {
    case KeyResultStatus.GREEN:
      return KeyResultStatus.YELLOW;
    case KeyResultStatus.YELLOW:
      return KeyResultStatus.RED;
    case KeyResultStatus.RED:
    default:
      return KeyResultStatus.GREEN;
  }
}
