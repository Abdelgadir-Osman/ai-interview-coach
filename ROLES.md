# Supported Roles & Customization

The AI Interview Coach is **not limited to Software Engineering** - it works for any role!

## How Role Customization Works

The coach uses the `targetRole` field to adapt questions and feedback. When you specify a role, the AI:

1. **Tailors behavioral questions** to be relevant to that role
2. **Adjusts technical questions** (if in technical/mixed mode) based on the role
3. **Provides role-appropriate feedback** and grading

## Setting Your Role

### Method 1: UI Input Field
Type your job title in the "Role:" field in the header (e.g., "Product Manager", "Data Scientist")

### Method 2: Command
Type `/role [job title]` in the chat:
- `/role Product Manager`
- `/role Data Scientist`
- `/role UX Designer`

### Method 3: API
Include `targetRole` in your POST request to `/api/chat`:
```json
{
  "sessionId": "...",
  "message": "...",
  "targetRole": "Product Manager"
}
```

## Role Examples

### Product Manager
- Behavioral questions about product decisions, user research, prioritization
- Technical questions about system design (if in technical mode)
- Focus areas: metrics, leadership, user-experience, strategy

### Data Scientist
- Behavioral questions about data analysis projects, insights, collaboration
- Technical questions about algorithms, statistics, ML systems
- Focus areas: metrics, clarity, statistical-thinking, impact

### UX Designer
- Behavioral questions about design process, user research, collaboration
- Technical questions about design systems, accessibility (if in technical mode)
- Focus areas: user-experience, communication, problem-solving

### Marketing Manager
- Behavioral questions about campaigns, metrics, cross-functional work
- Technical questions about analytics, tools (if in technical mode)
- Focus areas: metrics, impact, creativity, data-driven

### Business Analyst
- Behavioral questions about requirements gathering, stakeholder management
- Technical questions about data analysis, systems (if in technical mode)
- Focus areas: clarity, metrics, communication, problem-solving

### Software Engineer (Default)
- Behavioral questions about coding projects, debugging, teamwork
- Technical questions about algorithms, system design, architecture
- Focus areas: algorithms, system-design, complexity, tradeoffs

## Mode Compatibility by Role

### Behavioral Mode
✅ **Works for ALL roles** - STAR format questions are universal

### Technical Mode
✅ **Best for**: Software Engineering, Data Science, ML Engineering
⚠️ **Works for**: Other technical roles (use focus areas to customize)
❌ **Not ideal for**: Non-technical roles (use behavioral mode instead)

### Mixed Mode
✅ **Works for**: Any role that needs both behavioral and technical questions
- Software Engineering: Both behavioral and technical
- Product Manager: Behavioral + system design thinking
- Data Scientist: Behavioral + technical analysis

## Tips for Non-SWE Roles

1. **Use Behavioral Mode** for most non-technical roles
2. **Set your role** using `/role` command or UI field
3. **Use focus areas** to emphasize role-specific skills:
   - Product Manager: `/focus metrics`, `/focus leadership`, `/focus strategy`
   - Data Scientist: `/focus metrics`, `/focus clarity`, `/focus statistical-thinking`
   - UX Designer: `/focus user-experience`, `/focus communication`
4. **For technical roles**, use Mixed mode and focus areas to customize technical questions

## Default Behavior

If no role is specified, the coach defaults to:
- **Target Role**: "Software Engineering Intern"
- **Level**: "intern"

You can change both the role and level to match your needs.

---

**Remember**: The coach is flexible! Even if technical questions are SWE-optimized, behavioral questions work universally, and you can always use focus areas to customize the experience for your specific role.

