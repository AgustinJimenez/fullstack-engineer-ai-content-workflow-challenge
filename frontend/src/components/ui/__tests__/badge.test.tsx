import { render, screen } from '@testing-library/react'
import { Badge } from '../badge'

describe('Badge Component', () => {
  it('renders children correctly', () => {
    render(<Badge>Test Badge</Badge>)
    
    expect(screen.getByText('Test Badge')).toBeInTheDocument()
  })

  it('applies default variant classes', () => {
    render(<Badge>Default Badge</Badge>)
    
    const badge = screen.getByText('Default Badge')
    expect(badge).toHaveClass('bg-primary', 'text-primary-foreground')
  })

  it('applies secondary variant classes', () => {
    render(<Badge variant="secondary">Secondary Badge</Badge>)
    
    const badge = screen.getByText('Secondary Badge')
    expect(badge).toHaveClass('bg-secondary', 'text-secondary-foreground')
  })

  it('applies destructive variant classes', () => {
    render(<Badge variant="destructive">Destructive Badge</Badge>)
    
    const badge = screen.getByText('Destructive Badge')
    expect(badge).toHaveClass('bg-destructive', 'text-destructive-foreground')
  })

  it('applies outline variant classes', () => {
    render(<Badge variant="outline">Outline Badge</Badge>)
    
    const badge = screen.getByText('Outline Badge')
    expect(badge).toHaveClass('text-foreground')
  })

  it('accepts custom className', () => {
    render(<Badge className="custom-class">Custom Badge</Badge>)
    
    const badge = screen.getByText('Custom Badge')
    expect(badge).toHaveClass('custom-class')
  })

  it('forwards HTML attributes', () => {
    render(
      <Badge data-testid="custom-badge" aria-label="Test badge">
        Attributed Badge
      </Badge>
    )
    
    const badge = screen.getByTestId('custom-badge')
    expect(badge).toHaveAttribute('aria-label', 'Test badge')
  })
})