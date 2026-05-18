import React from 'react';

const Step3 = ({ formData }) => {
  return (
    <div>
      <h3>Confirmation</h3>
      <p>Please review your information:</p>
      <ul>
        <li><strong>First Name:</strong> {formData.firstName}</li>
        <li><strong>Last Name:</strong> {formData.lastName}</li>
        <li><strong>Email:</strong> {formData.email}</li>
        <li><strong>Min Experience:</strong> {formData.minExperience} years</li>
        <li><strong>Max Experience:</strong> {formData.maxExperience} years</li>
        <li><strong>Street:</strong> {formData.street}</li>
        <li><strong>City:</strong> {formData.city}</li>
        <li><strong>State:</strong> {formData.state}</li>
        <li><strong>Zip Code:</strong> {formData.zipCode}</li>
      </ul>
    </div>
  );
};

export default Step3;