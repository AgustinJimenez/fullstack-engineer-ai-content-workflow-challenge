import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '../button'

describe('Button Component', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>)
    
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('applies default variant classes', () => {
    render(<Button>Default Button</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-primary', 'text-primary-foreground')
  })

  it('applies secondary variant classes', () => {
    render(<Button variant="secondary">Secondary Button</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-secondary', 'text-secondary-foreground')
  })

  it('applies destructive variant classes', () => {
    render(<Button variant="destructive">Destructive Button</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-destructive', 'text-destructive-foreground')
  })

  it('applies outline variant classes', () => {
    render(<Button variant="outline">Outline Button</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('border', 'border-input', 'bg-background')
  })

  it('applies ghost variant classes', () => {
    render(<Button variant="ghost">Ghost Button</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('hover:bg-accent', 'hover:text-accent-foreground')
  })

  it('applies link variant classes', () => {
    render(<Button variant="link">Link Button</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('text-primary', 'underline-offset-4')
  })

  it('applies small size classes', () => {
    render(<Button size="sm">Small Button</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('h-8', 'rounded-md', 'px-3', 'text-xs')
  })

  it('applies large size classes', () => {
    render(<Button size="lg">Large Button</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('h-10', 'rounded-md', 'px-8')
  })

  it('applies icon size classes', () => {
    render(<Button size="icon">👍</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('h-9', 'w-9')
  })

  it('handles click events', async () => {
    const user = userEvent.setup()
    const handleClick = jest.fn()
    
    render(<Button onClick={handleClick}>Click me</Button>)
    
    const button = screen.getByRole('button')
    await user.click(button)
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50')
  })

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup()
    const handleClick = jest.fn()
    
    render(<Button onClick={handleClick} disabled>Disabled Button</Button>)
    
    const button = screen.getByRole('button')
    await user.click(button)
    
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('accepts custom className', () => {
    render(<Button className="custom-class">Custom Button</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })

  it('forwards HTML attributes', () => {
    render(
      <Button data-testid="custom-button" aria-label="Custom button">
        Button with attributes
      </Button>
    )
    
    const button = screen.getByTestId('custom-button')
    expect(button).toHaveAttribute('aria-label', 'Custom button')
  })

  it('renders as child component when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    )
    
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/test')
    expect(link).toHaveClass('inline-flex', 'items-center', 'justify-center')
  })
})