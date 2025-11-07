# Git Push Workflow

## Function
Complete git workflow including branch management and PR creation

## Trigger Condition
When user inputs `/git_push`

## Behavior
1. Commit code using conventional-changelog style
2. Create or switch to feature branch (e.g., feature/xxx) instead of directly to main
3. Execute `git push origin <branch-name>`
4. Automatically create PR after push
5. Switch back to main branch after PR creation

## Branch Naming Convention
- `feature/description`: New features
- `fix/description`: Bug fixes
- `docs/description`: Documentation updates
- `refactor/description`: Code refactoring
- `chore/description`: Maintenance tasks

## PR Creation
- Use conventional-changelog style for PR title
- Include detailed description of changes
- Reference related issues if applicable
- Add appropriate labels and reviewers

## Quality Checklist
- [ ] Working on appropriate feature branch
- [ ] Commit message follows conventional-changelog format
- [ ] All changes are committed and pushed
- [ ] PR is created with proper title and description
- [ ] Switched back to main branch