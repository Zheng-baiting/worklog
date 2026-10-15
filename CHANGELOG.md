# 变更记录

## 0.1.0 — 2026-10-15

首次为现有源码登记可追溯版本；项目仍处于停用、源码保留状态。本次补齐版本信息与维护说明，没有改动工资算法、网页功能或个人记录，也没有重新部署。

基线：[d623026](https://github.com/Zheng-baiting/worklog/commit/d623026)。该源码已有班次分钟及工资计算、周期统计、本机存储、JSON 导入导出与空个人记录模板；个人考勤不在仓库中。

登记验证：`node --test test.cjs hourly.test.cjs shift.test.cjs`，11 项通过。

## 登记前的历史

- [a64d4e8](https://github.com/Zheng-baiting/worklog/commit/a64d4e8)：连班持续至 19:10。
- [cad5e15](https://github.com/Zheng-baiting/worklog/commit/cad5e15)：中加班及一次性本机记录更新支持。
- [7f0aee5](https://github.com/Zheng-baiting/worklog/commit/7f0aee5)：按统计周期计算班次时长和工资。

这些旧提交当时没有登记软件版本，不补造连续版本号。备份文件的 `version: 3` 仍是数据格式版本。
