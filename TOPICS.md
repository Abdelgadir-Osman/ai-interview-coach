# Interview Topics & Focus Areas

This document explains what topics the AI Interview Coach covers and how to use focus areas to customize your practice.

## 🎯 Not Just for Software Engineering!

**The coach defaults to Software Engineering but works for ANY role!**

- **Behavioral questions** work universally for any job (Product Manager, Data Scientist, UX Designer, Marketing, Sales, etc.)
- **Technical questions** are optimized for software engineering, but you can customize with focus areas
- **Set your target role** using the role input field in the UI or `/role [job title]` command
- The AI adapts questions based on your specified role

### How to Set Your Role

1. **In the UI**: Type your job title in the "Role:" field in the header (e.g., "Product Manager", "Data Scientist")
2. **Via command**: Type `/role Product Manager` or `/role Data Scientist` in the chat
3. **Via API**: Include `targetRole` in your request body

The coach will tailor questions to your specified role!

## 📚 Topics Covered by Mode

### Behavioral Mode
The coach asks **STAR format** questions about:

- **Past experiences**: Projects, challenges, achievements
- **Teamwork & collaboration**: Working with others, resolving conflicts
- **Problem-solving**: Handling difficult situations, making decisions
- **Leadership**: Taking initiative, mentoring, managing projects
- **Communication**: Presenting ideas, handling feedback
- **Time management**: Meeting deadlines, prioritizing tasks
- **Adaptability**: Learning new skills, handling change

**Grading focuses on:**
- **Situation**: Clear context and background
- **Task**: Explicit goal or responsibility
- **Action**: Concrete steps, ownership, tradeoffs considered
- **Result**: Measurable outcomes + reflection
- **Clarity**: Structured, concise communication
- **Impact**: Scale, metrics, stakes

### Technical Mode
The coach asks questions about:

- **Algorithm design**: Data structures, complexity analysis
- **System architecture**: Scalability, distributed systems
- **Problem-solving**: Breaking down technical challenges
- **Tradeoffs**: Performance vs. maintainability, different approaches
- **Edge cases**: Handling boundary conditions
- **Real-world constraints**: Memory, latency, reliability

**Grading focuses on:**
- **Correctness/feasibility**: Does the approach work?
- **Clarity**: Can you explain it clearly?
- **Tradeoffs**: Understanding pros/cons
- **Structured communication**: Steps, assumptions, reasoning
- **Impact**: Realism, constraints, edge cases considered

**Note**: Technical mode is optimized for software engineering roles. For other technical roles (Data Scientist, ML Engineer, etc.), use focus areas to customize the technical questions.

### Mixed Mode
Combines both behavioral and technical questions:
- Alternates between STAR format and technical problem-solving
- Tests both soft skills and technical knowledge
- Simulates real interviews that cover both areas

## 🎯 Focus Areas (Using `/focus`)

You can customize what the coach emphasizes by using the `/focus` command. The focus areas are **flexible** - you can specify any topic, and the AI will adapt questions and feedback accordingly.

### How It Works

1. **Add a focus area**: Type `/focus [topic]` in the chat
   - Example: `/focus metrics`
   - Example: `/focus system design`
   - Example: `/focus leadership`

2. **Multiple focus areas**: You can add multiple topics
   - `/focus metrics`
   - `/focus clarity`
   - Both will be active

3. **AI adaptation**: The coach will:
   - Generate questions that emphasize your focus areas
   - Provide feedback that highlights those topics
   - Adjust grading rubrics to weight those areas more

### Common Focus Areas

#### For Behavioral Interviews

- **`metrics`** - Emphasize quantifiable results and measurable impact
- **`leadership`** - Focus on taking initiative and managing others
- **`conflict`** - Practice handling disagreements and difficult situations
- **`teamwork`** - Emphasize collaboration and working with others
- **`communication`** - Focus on clarity and structured responses
- **`problem-solving`** - Emphasize analytical thinking and decision-making
- **`time-management`** - Focus on prioritization and meeting deadlines

#### For Technical Interviews

- **`algorithms`** - Focus on data structures and algorithm design
- **`system-design`** or **`architecture`** - Emphasize scalable system design
- **`complexity`** - Focus on time/space complexity analysis
- **`tradeoffs`** - Emphasize understanding pros/cons of different approaches
- **`edge-cases`** - Focus on handling boundary conditions
- **`optimization`** - Emphasize performance improvements

#### For Mixed Interviews

- **`metrics`** - Quantifiable results in both behavioral and technical contexts
- **`clarity`** - Clear communication in all responses
- **`impact`** - Demonstrating real-world impact
- **`structure`** - Well-organized answers (STAR for behavioral, step-by-step for technical)

### Examples

```
/focus metrics
```
The coach will ask questions that require you to include numbers, percentages, or measurable outcomes in your answers.

```
/focus system-design
```
The coach will emphasize architectural questions and evaluate your system design skills more heavily.

```
/focus leadership
```
The coach will ask more questions about taking initiative, managing teams, and leading projects.

```
/focus clarity
```
The coach will provide more feedback on how well-structured and clear your answers are.

## 🔍 Automatic Weakness Tracking

The system automatically tracks these weakness signals:

1. **`missing_metrics`** - Answers lack quantifiable results
2. **`weak_result`** - Results are vague or not impactful
3. **`unclear_task`** - Task/goal is not clearly explained
4. **`rambling`** - Answers are unstructured or too verbose

The coach automatically adapts questions based on these signals, even without explicit focus areas. The "Current Focus" shown in your stats panel reflects the most frequent weakness.

## 💡 Tips for Using Focus Areas

1. **Start broad, then narrow**: Begin without focus areas to see your baseline, then add focus areas for specific improvement.

2. **Combine with modes**: 
   - Use `/focus metrics` with behavioral mode to practice quantifying your impact
   - Use `/focus system-design` with technical mode for architecture practice

3. **Check your summary**: Use `/summary` to see how focus areas are affecting your practice.

4. **Reset when needed**: Use `/reset` to clear focus areas and start fresh.

## 🎓 Example Interview Flows

### Product Manager Interview
```
/role Product Manager
/start behavioral
/focus metrics
/focus leadership
```
You'll get STAR questions tailored for product management, emphasizing metrics, leadership, and product thinking.

### Data Scientist Interview
```
/role Data Scientist
/start mixed
/focus metrics
/focus clarity
```
You'll get both behavioral and technical questions, with emphasis on data-driven thinking and clear communication.

### Software Engineering Interview
```
/role Software Engineer
/start technical
/focus system-design
/focus algorithms
```
You'll get technical questions focused on system design and algorithms.

### Behavioral Interview with Metrics Focus (Any Role)
```
/start behavioral
/focus metrics
```
You'll get STAR questions that specifically require you to include numbers, percentages, or measurable outcomes.

### Mixed Interview with Multiple Focuses
```
/start mixed
/focus clarity
/focus impact
```
You'll get both behavioral and technical questions, with emphasis on clear communication and demonstrating impact.

---

**Note**: Focus areas are suggestions to the AI - it will adapt questions and feedback accordingly, but the exact implementation depends on the AI's interpretation. The system is designed to be flexible and helpful rather than rigidly prescriptive.

