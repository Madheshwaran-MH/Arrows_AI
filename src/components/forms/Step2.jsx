import React from 'react';
import FormField from './FormField';

const Step2 = ({ formData, onChange }) => {
  return (
    <div>
      <h3>Address Information</h3>
      <FormField
        label="Street"
        type="text"
        name="street"
        value={formData.street || ''}
        onChange={onChange}
        required
      />
      <FormField
        label="City"
        type="text"
        name="city"
        value={formData.city || ''}
        onChange={onChange}
        required
      />
      <FormField
        label="State"
        type="text"
        name="state"
        value={formData.state || ''}
        onChange={onChange}
        required
      />
      <FormField
        label="Zip Code"
        type="text"
        name="zipCode"
        value={formData.zipCode || ''}
        onChange={onChange}
        required
      />
    </div>
  );
};

export default Step2;