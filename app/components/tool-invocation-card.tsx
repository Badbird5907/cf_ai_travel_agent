import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { isToolUIPart } from "ai";
import type { UIMessage } from "@ai-sdk/react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface ToolInvocationCardProps {
  toolUIPart: any; // Using any for now, should be properly typed
  toolCallId: string;
  needsConfirmation: boolean;
  onSubmit: (params: { toolCallId: string; result: any }) => void;
  addToolResult: (toolCallId: string, result: any) => void;
}

export function ToolInvocationCard({
  toolUIPart,
  toolCallId,
  needsConfirmation,
  onSubmit,
  addToolResult,
}: ToolInvocationCardProps) {
  if (!isToolUIPart(toolUIPart)) return null;

  const handleConfirm = () => {
    onSubmit({ toolCallId, result: { confirmed: true } });
  };

  const handleReject = () => {
    onSubmit({ toolCallId, result: { confirmed: false } });
  };

  if (false) {
    return (
      <div className="my-2">
        <span className="font-medium">
          Used Tool: {toolUIPart.type.replace("tool-", "")}
        </span>
      </div>
    )
  }
  return (
    <Card className="my-2 px-4">
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>
            <h4 className="font-medium">Tool: {toolUIPart.type.replace("tool-", "")}</h4>
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-sm text-muted-foreground">
              Status: {toolUIPart.state}
            </p>

            {/* Show tool input */}
            {toolUIPart.input != null && (
              <div className="text-sm">
                <strong>Input:</strong>
                <pre className="bg-muted p-2 rounded mt-1 text-xs overflow-auto">
                  {JSON.stringify(toolUIPart.input, null, 2)}
                </pre>
              </div>
            )}

            {/* Show tool output */}
            {toolUIPart.output != null && (
              <div className="text-sm">
                <strong>Output:</strong>
                <pre className="bg-muted p-2 rounded mt-1 text-xs overflow-auto">
                  {typeof toolUIPart.output === 'string'
                    ? toolUIPart.output
                    : JSON.stringify(toolUIPart.output, null, 2)
                  }
                </pre>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {toolUIPart.state === "input-available" && needsConfirmation && (
        <div className="flex gap-2">
          <Button onClick={handleConfirm} size="sm">
            Confirm
          </Button>
          <Button onClick={handleReject} variant="outline" size="sm">
            Cancel
          </Button>
        </div>
      )}
    </Card>
  );
}
