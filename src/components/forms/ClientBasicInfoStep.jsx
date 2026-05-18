import React, { useEffect, useMemo } from "react";
import FormField from "./FormField";

const ClientBasicInfoStep = ({
  formData,
  onChange,
  fields = [],
  onSetStepFields,
  validationErrors = {},
}) => {
  useEffect(() => {
    if (!onSetStepFields) return;
    onSetStepFields(
      fields.map((field) => ({
        name: field.name,
        label: field.label,
        required: Boolean(field.required),
      }))
    );
  }, [fields, onSetStepFields]);

  const fieldMap = useMemo(() => {
    const map = {};
    fields.forEach((field) => {
      map[field.name] = field;
    });
    return map;
  }, [fields]);

  const renderField = (name, extraClass = "") => {
    const field = fieldMap[name];
    if (!field) return null;
    const value =
      formData[field.name] || (field.type === "multiselect" ? [] : "");

    return (
      <div className={`client-cell${extraClass ? ` ${extraClass}` : ""}`}>
        <FormField
          key={field.name}
          label={field.label}
          type={field.type}
          name={field.name}
          value={value}
          onChange={onChange}
          required={field.required}
          options={field.options}
          validate={field.validate}
          error={validationErrors[field.name]}
          onValidation={field.onValidation}
          placeholder={field.placeholder}
          hideLabel={field.hideLabel}
          accept={field.accept}
          multiple={field.multiple}
          prefix={field.prefix}
          formData={formData}
        />
      </div>
    );
  };

  return (
    <div className="client-step">
      <div className="client-grid">
        {renderField("clientId")}
        {renderField("clientName")}
        {renderField("contactEmail")}
        {renderField("contactNumber")}
        {renderField("primaryContactPerson")}
        {renderField("secondaryContactPerson")}
        {renderField("accountManager")}
        {renderField("activeFrom")}
        <div className="client-spacer" aria-hidden="true" />
        {renderField("comments")}
      </div>
    </div>
  );
};

export default ClientBasicInfoStep;
