import React from 'react';
import PropTypes from 'prop-types';
import styles from './StepProgressBar.module.scss';
import { FiCheck } from 'react-icons/fi';

/**
 * StepProgressBar Component
 * A multi-step progress indicator with numbered steps and connecting lines
 * Perfect for showing application stages, recruitment pipeline, etc.
 * 
 * @param {Array} steps - Array of step objects: [{ label: string, status: 'complete'|'active'|'pending' }]
 * @param {number} currentStep - Current active step index (0-based)
 * @param {boolean} showLabels - Display step labels
 */
const StepProgressBar = ({ 
  steps = [], 
  currentStep = 0,
  showLabels = true,
  orientation = 'horizontal' // 'horizontal' or 'vertical'
}) => {
  const getStepStatus = (index) => {
    if (index < currentStep) return 'complete';
    if (index === currentStep) return 'active';
    return 'pending';
  };

  const containerClasses = [
    styles.stepProgressBar,
    orientation === 'vertical' && styles.vertical
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {steps.map((step, index) => {
        const status = getStepStatus(index);
        const stepClasses = [
          styles.step,
          styles[status]
        ].filter(Boolean).join(' ');

        return (
          <React.Fragment key={index}>
            <div className={stepClasses}>
              <div className={styles.stepCircle}>
                {status === 'complete' ? (
                  <FiCheck className={styles.checkIcon} />
                ) : (
                  <span className={styles.stepNumber}>{index + 1}</span>
                )}
              </div>
              {showLabels && (
                <div className={styles.stepLabel}>{step.label || `Step ${index + 1}`}</div>
              )}
            </div>
            {index < steps.length - 1 && (
              <div className={styles.connector}>
                <div 
                  className={styles.connectorLine}
                  data-status={index < currentStep ? 'complete' : 'pending'}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

StepProgressBar.propTypes = {
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string
    })
  ).isRequired,
  currentStep: PropTypes.number,
  showLabels: PropTypes.bool,
  orientation: PropTypes.oneOf(['horizontal', 'vertical'])
};

export default StepProgressBar;
