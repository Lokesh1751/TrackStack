declare module "react-mentions" {
  import * as React from "react";

  export interface MentionProps {
    trigger: string | RegExp;
    data: any[] | ((query: string, callback: (data: any[]) => void) => void);
    renderSuggestion?: (
      suggestion: any,
      search: string,
      highlightedDisplay: React.ReactNode,
      index: number,
      focused: boolean
    ) => React.ReactNode;
    markup?: string;
    displayTransform?: (id: string, display: string) => string;
    className?: string;
    style?: any;
    appendSpaceOnAdd?: boolean;
  }

  export interface MentionsInputProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange" | "onBlur" | "onKeyDown" | "style"> {
    value: string;
    onChange: (event: { target: { value: string } }, newValue: string, newPlainTextValue: string, mentions: any[]) => void;
    placeholder?: string;
    className?: string;
    style?: any;
    children: React.ReactElement<MentionProps> | Array<React.ReactElement<MentionProps>>;
    a11ySuggestionsListLabel?: string;
  }

  export const MentionsInput: React.ComponentType<MentionsInputProps>;
  export const Mention: React.ComponentType<MentionProps>;
}
