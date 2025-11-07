# Git Commit Workflow

## Function
Git commit and push workflow following OpenAgentKit standards

## Trigger Condition
When user inputs `/git_commit`

## Behavior
1. Commit code using conventional-changelog style
2. Execute `git push origin <branch-name>`

## Commit Message Format
Follow conventional-changelog style:
```
type(scope): description

[optional body]

[optional footer]
```

### Commit Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples
```
feat(auth): add OAuth2 authentication support
fix(ui): resolve button alignment issue in mobile view
docs(api): update authentication endpoint documentation
```

## Quality Checklist
- [ ] Commit message follows conventional-changelog format
- [ ] Changes are properly staged
- [ ] No sensitive information in commit
- [ ] Code passes linting and tests