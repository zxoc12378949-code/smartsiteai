# Product Requirements Document (PRD)

# SmartSite AI
## Construction Safety Inspection & Defect Management Platform

Version: 1.0

Status: Planning

Owner: Product Team

---

# 1. Product Overview

## Product Name

SmartSite AI

## Product Vision

SmartSite AI 是一套專為營造工地打造的智慧巡檢與缺失管理平台。

本系統旨在解決傳統工地巡檢過程中資訊分散、缺失追蹤困難、照片管理混亂以及改善進度無法有效掌握等問題。

透過數位化巡檢流程、雲端資料管理與 AI 輔助風險分析機制，提升工地安全管理效率並降低工安事故風險。

---

# 2. Business Problem

目前多數工地仍存在以下問題：

## 巡檢流程分散

- 紙本巡檢表
- Excel紀錄
- LINE群組傳送照片
- Email回報缺失

導致資料難以統整。

---

## 缺失追蹤困難

發現問題後：

- 無法確認責任人
- 無法追蹤改善進度
- 缺乏到期提醒機制

造成缺失長期未改善。

---

## 缺乏數據分析

管理者無法快速掌握：

- 工區風險狀況
- 常見缺失類型
- 安全趨勢變化
- 巡檢執行情況

---

# 3. Product Objectives

本系統需達成以下目標：

### O1

建立標準化工地巡檢流程

### O2

集中管理巡檢紀錄

### O3

建立缺失追蹤機制

### O4

提供風險評估能力

### O5

提供即時管理 Dashboard

### O6

降低工安管理成本

### O7

建立智慧工地管理基礎架構

---

# 4. User Roles

## Inspector

巡檢人員

權限：

- 建立巡檢
- 上傳照片
- 建立缺失

---

## Site Manager

工地主任

權限：

- 管理缺失
- 指派責任人
- 查看改善進度

---

## Supervisor

監造人員

權限：

- 查看巡檢紀錄
- 查看缺失狀態
- 查看報表

---

## Administrator

系統管理者

權限：

- 使用者管理
- 系統設定
- 權限管理

---

# 5. Core Modules

系統包含以下模組：

## Dashboard

工地總覽

---

## Inspection Management

巡檢管理

---

## Defect Management

缺失管理

---

## Risk Analysis

風險分析

---

## Reports

報表中心

---

## User Management

使用者管理

---

# 6. Dashboard Requirements

## KPI Cards

顯示：

### Total Inspections

巡檢總數

### Open Defects

未完成缺失

### High Risk Issues

高風險缺失

### Completion Rate

巡檢完成率

---

## Charts

### Defect Distribution

缺失類型分布

Chart Type：

Donut Chart

---

### Inspection Completion Trend

巡檢完成率趨勢

Chart Type：

Bar Chart

---

### High Risk Trend

高風險事件趨勢

Chart Type：

Line Chart

---

## Recent Activities

顯示：

- 最近巡檢
- 最近缺失
- 最近改善紀錄

---

# 7. Inspection Management

## Create Inspection

### Basic Information

欄位：

- Inspection Date
- Project Name
- Work Area
- Inspector

---

### Checklist

檢查項目：

- Safety Helmet Compliance
- Scaffold Safety
- Electrical Safety
- Fall Protection
- Material Storage
- Site Housekeeping

---

### Inspection Result

選項：

- Pass
- Warning
- Fail

---

### Photo Upload

支援：

- Mobile Camera
- Image Upload

---

### Notes

多行文字輸入

---

# 8. Defect Management

## Create Defect

欄位：

### Title

缺失標題

### Description

缺失描述

### Work Area

工區

### Responsible Person

負責人

### Due Date

改善期限

### Risk Level

- Low
- Medium
- High

---

### Attachments

照片與文件

---

## Defect Status

### Open

待改善

### In Progress

改善中

### Resolved

已完成

### Closed

已結案

---

# 9. Risk Analysis Module

## Risk Formula

Risk Score = Severity × Probability

---

## Severity

事故嚴重程度

Scale：

1~5

---

## Probability

發生機率

Scale：

1~5

---

## Risk Matrix

| Score | Level |
|---------|---------|
| 1-5 | Low |
| 6-15 | Medium |
| 16-25 | High |

---

## AI Recommendation Engine

系統需依據缺失類型提供建議：

例如：

### Defect

Worker without safety harness

### Risk Level

High

### Recommendation

Immediate corrective action required.

---

# 10. Reports Module

## Inspection Report

內容：

- 巡檢摘要
- 缺失摘要
- 風險分析

---

## Defect Report

內容：

- 缺失統計
- 責任人分析
- 改善率分析

---

## Export

支援：

- PDF
- Excel

---

# 11. User Management

## User Profile

欄位：

- Name
- Email
- Department
- Role

---

## Role Management

支援：

- Administrator
- Site Manager
- Inspector
- Supervisor

---

# 12. Notification System

## Events

### New Defect Created

通知相關人員

---

### Due Date Approaching

到期提醒

---

### Defect Overdue

逾期通知

---

### Defect Resolved

改善完成通知

---

# 13. Responsive Requirements

系統需支援：

## Desktop

1440px+

---

## Tablet

768px+

---

## Mobile

390px+

---

# 14. Design System

## Style

Modern Enterprise SaaS

Construction Technology Platform

Industrial Professional Design

---

## Colors

Primary

#0F172A

Secondary

#334155

Warning

#F97316

Success

#22C55E

Danger

#EF4444

Background

#F8FAFC

---

## UI Components

- KPI Cards
- Data Tables
- Charts
- Filters
- Modals
- Drawers
- File Upload Components
- Status Badges

---

# 15. Future Roadmap

## Phase 2

AI Image Recognition

- Helmet Detection
- Safety Vest Detection
- Fall Protection Detection

---

## Phase 3

BIM Integration

- BIM Model Linkage
- Location Mapping
- Issue Position Tracking

---

## Phase 4

Mobile Application

- iOS
- Android

---

# Success Metrics

- Inspection Completion Rate > 90%
- Defect Closure Rate > 85%
- Reduction in Manual Reporting Time > 50%
- Increase in Safety Compliance Tracking Accuracy

---

# Final Goal

建立一套可實際部署於營造工地的智慧巡檢與缺失管理平台，提供數位化巡檢流程、風險分析能力與完整的工地安全管理機制，作為企業級智慧工地解決方案。