import React, { useState } from 'react';
import MultiStepForm from '../../components/forms/MultiStepForm';
import Step1 from '../../components/forms/Step1';
import Step2 from '../../components/forms/Step2';
import Step3 from '../../components/forms/Step3';
import DataTable from '../../components/forms/DataTable';
import './ApplicationForm.css';

const ApplicationForm = () => {
  const [submittedData, setSubmittedData] = useState([]);

  const steps = [
    { component: Step1 },
    { component: Step2 },
    { component: Step3 },
  ];

  const handleSubmit = (formData) => {
    setSubmittedData([...submittedData, formData]);
    alert('Form submitted successfully!');
  };

  const columns = [
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'email', label: 'Email' },
    { key: 'minExperience', label: 'Min Experience' },
    { key: 'maxExperience', label: 'Max Experience' },
    { key: 'street', label: 'Street' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'zipCode', label: 'Zip Code' },
  ];

  return (
    <div className="application-form-page">
      <h1>Application Form</h1>
      <MultiStepForm steps={steps} onSubmit={handleSubmit} />
      {submittedData.length > 0 && (
        <div>
          <h2>Submitted Applications</h2>
          <DataTable data={submittedData} columns={columns} />
        </div>
      )}
    </div>
  );
};

export default ApplicationForm;