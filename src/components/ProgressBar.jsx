import React from 'react';
import PropTypes from 'prop-types';
import styles from './ProgressBar.module.scss';

/**
 * ProgressBar Component
 * A customizable progress bar with animated stripes and various color themes
 * Based on CSS Tricks CSS3 Progress Bars technique
 * 
 * @param {number} percentage - Progress value (0-100)
 * @param {string} color - Theme color: 'green', 'orange', 'red', 'blue'
 * @param {boolean} animate - Enable animated stripes
 * @param {boolean} showPercentage - Display percentage text
 * @param {number} animationDuration - Duration in milliseconds for the fill animation
 */
const ProgressBar = ({ 
  percentage = 0, 
  color = 'green', 
  animate = false,
  showPercentage = false,
  animationDuration = 1200,
  height = 20
}) => {
  const [animatedWidth, setAnimatedWidth] = React.useState(0);

  // Clamp percentage between 0 and 100
  const validPercentage = Math.min(Math.max(percentage, 0), 100);

  React.useEffect(() => {
    // Animate the width on mount
    const timer = setTimeout(() => {
      setAnimatedWidth(validPercentage);
    }, 100);

    return () => clearTimeout(timer);
  }, [validPercentage]);

  const meterClasses = [
    styles.meter,
    color && styles[color],
    animate && styles.animate
  ].filter(Boolean).join(' ');

  const meterStyle = {
    height: `${height}px`,
    padding: `${height / 2}px`
  };

  const spanStyle = {
    width: `${animatedWidth}%`,
    transition: `width ${animationDuration}ms ease-out`
  };

  return (
    <div className={styles.meterWrapper}>
      <div className={meterClasses} style={meterStyle}>
        <span style={spanStyle}>
          {animate && <span className={styles.stripes}></span>}
        </span>
      </div>
      {showPercentage && (
        <span className={styles.percentage}>{validPercentage}%</span>
      )}
    </div>
  );
};

ProgressBar.propTypes = {
  percentage: PropTypes.number,
  color: PropTypes.oneOf(['green', 'orange', 'red', 'blue']),
  animate: PropTypes.bool,
  showPercentage: PropTypes.bool,
  animationDuration: PropTypes.number,
  height: PropTypes.number
};

export default ProgressBar;
