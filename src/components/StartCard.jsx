

import * as React from "react";
import { Card, CardContent, Typography } from "@mui/material";
import styles from "./StartCard.module.scss";


export default function StatCard({ title, value, tone }) {
  const toneClass =
    tone === "success" ? styles.success :
    tone === "danger" ? styles.danger :
    "";


  return (
    <Card elevation={1} className={`${styles.root} ${toneClass}`}>
      <CardContent>
        <Typography className={styles.title}>{title}</Typography>
        <Typography className={styles.value}>{value}</Typography>
      </CardContent>
    </Card>
  );
}
``





