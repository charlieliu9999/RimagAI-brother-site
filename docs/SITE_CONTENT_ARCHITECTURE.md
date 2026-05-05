# RimagAi Brother Site Content Architecture

## Source Decomposition

| Source | Role | Content Used |
| --- | --- | --- |
| `2026-04-15-MCOS白皮书-发布版.html` | Architecture and credibility source | MCOS definition, boundaries, six-layer model, validation boundary, deployment path, phased rollout logic |
| `MCOS_Medical_AI_Operating_Layer.pptx` | Visual architecture source | MCOS operating layer visuals, runtime loop, governance levels, landing plan |
| `智能体平台及小工具-260204.pptx` | Product and tool source | Agent platform, examination recommendation, report QC, report generation, knowledge QA, iSPACS embedded agent, patient report interpretation |
| `rimag-brother-site-mcos-cdss-drg/mcos_hospital_decision_introduction.html` | Decision-maker narrative source | Hospital-facing value proposition, product grouping, DRG/CDSS/quality-control operational framing |

## Page Responsibilities

| Page | Primary Job | Source Priority |
| --- | --- | --- |
| `index.html` | Executive entry: what MCOS is and where to go next | System introduction + architecture summary |
| `system-introduction.html` | Main hospital decision-maker introduction | All sources synthesized |
| `hospital-solution.html` | Department and workflow mapping for hospital leadership | Decision-maker doc + product PPT |
| `radiology-solution.html` | Radiology-specific workflow: report generation, QC, structure extraction | Product PPT + existing screenshots |
| `acrac-system.html` | ACR/ACRAC governance, recommendation rules, model evaluation | Product PPT + existing ACRAC content |
| `data-platform.html` | Controlled data querying and semantic data agent | Existing data page + agent platform source |
| `architecture.html` | Technical/strategic MCOS layer definition and boundary | Whitepaper + MCOS deck |
| `mcos-blueprint-whitepaper.html` | Long-form whitepaper reader | Existing long-form whitepaper |

## Product Matrix

| Product | Best Page | Key Message |
| --- | --- | --- |
| Clinical Assistant | `hospital-solution.html` | Patient summary, medical record draft, CDSS, medication/order checks |
| Examination Recommendation | `acrac-system.html` | ACR/clinical guideline matching, top recommendations, evidence and risk |
| Medical Report QC | `radiology-solution.html` | Rule-based and semantic QC before report submission |
| DRG Pre-audit | `hospital-solution.html` | Coding, grouping, cost and medical-insurance risk moved before discharge |
| Hospital Data Agent | `data-platform.html` | Controlled semantic querying with permissions, metric definitions and audit |
| Patient Report Interpretation | future patient-facing page | Mini-program report explanation, terminology translation and consultation path |

## Integration Rule

The site should keep two deliverable modes:

- Web mode: dark product-site pages for browsing, conversion and scenario navigation.
- Document mode: light decision-maker/PDF pages for printing, proposal attachments and hospital briefings.

Both modes should share the same narrative spine:

Hospital pain -> why single-point AI is insufficient -> MCOS six-layer architecture -> product matrix -> department scenarios -> governance and safety -> phased rollout -> measurable value.
