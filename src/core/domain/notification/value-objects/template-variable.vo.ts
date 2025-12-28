// ============================================
// TEMPLATE VARIABLE VALUE OBJECT
// src/core/domain/notification/value-objects/template-variable.vo.ts
// ============================================

import { ValueObject } from '../../base/ValueObject';

interface TemplateVariableProps {
  name: string;
  description?: string;
  required: boolean;
  defaultValue?: string;
}

/**
 * Value object representing a template variable definition
 */
export class TemplateVariable extends ValueObject<TemplateVariableProps> {
  private constructor(props: TemplateVariableProps) {
    super(props);
  }

  public static create(props: TemplateVariableProps): TemplateVariable {
    if (!props.name || props.name.trim().length === 0) {
      throw new Error('Template variable name is required');
    }

    // Variable names should be alphanumeric with underscores
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(props.name)) {
      throw new Error(
        'Invalid variable name format. Use alphanumeric characters and underscores only.',
      );
    }

    return new TemplateVariable({
      name: props.name.trim(),
      description: props.description?.trim(),
      required: props.required,
      defaultValue: props.defaultValue,
    });
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get required(): boolean {
    return this.props.required;
  }

  get defaultValue(): string | undefined {
    return this.props.defaultValue;
  }

  /**
   * Get the placeholder pattern for this variable
   * e.g., {{userName}}
   */
  get placeholder(): string {
    return `{{${this.props.name}}}`;
  }
}

/**
 * Collection of template variables with validation
 */
export class TemplateVariables {
  private readonly variables: Map<string, TemplateVariable>;

  private constructor(variables: TemplateVariable[]) {
    this.variables = new Map(variables.map((v) => [v.name, v]));
  }

  public static create(variables: TemplateVariableProps[]): TemplateVariables {
    const templateVars = variables.map((v) => TemplateVariable.create(v));
    return new TemplateVariables(templateVars);
  }

  public static fromJSON(json: any): TemplateVariables {
    if (!json || !Array.isArray(json)) {
      return new TemplateVariables([]);
    }
    return TemplateVariables.create(json);
  }

  get all(): TemplateVariable[] {
    return Array.from(this.variables.values());
  }

  get requiredVariables(): TemplateVariable[] {
    return this.all.filter((v) => v.required);
  }

  get optionalVariables(): TemplateVariable[] {
    return this.all.filter((v) => !v.required);
  }

  has(name: string): boolean {
    return this.variables.has(name);
  }

  get(name: string): TemplateVariable | undefined {
    return this.variables.get(name);
  }

  /**
   * Validate that all required variables have values
   */
  validateValues(values: Record<string, string>): {
    valid: boolean;
    missing: string[];
  } {
    const missing = this.requiredVariables
      .filter((v) => !values[v.name] && !v.defaultValue)
      .map((v) => v.name);

    return {
      valid: missing.length === 0,
      missing,
    };
  }

  /**
   * Apply default values to the provided values object
   */
  applyDefaults(values: Record<string, string>): Record<string, string> {
    const result = { ...values };
    for (const variable of this.all) {
      if (!result[variable.name] && variable.defaultValue !== undefined) {
        result[variable.name] = variable.defaultValue;
      }
    }
    return result;
  }

  toJSON(): TemplateVariableProps[] {
    return this.all.map((v) => v.toJSON());
  }
}
