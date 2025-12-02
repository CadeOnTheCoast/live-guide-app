import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

describe("Card component", () => {
  it("renders child content", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Card</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Card body</p>
        </CardContent>
      </Card>
    );

    expect(screen.getByText("Test Card")).toBeInTheDocument();
    expect(screen.getByText("Card body")).toBeInTheDocument();
  });
});
