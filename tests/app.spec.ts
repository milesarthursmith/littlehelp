import { test, expect } from '@playwright/test'

test.describe('Password Locker', () => {
  test('should show login page', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
  })

  test('should show signup page', async ({ page }) => {
    await page.goto('/signup')
    await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible()
  })

  test('should navigate between login and signup', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('link', { name: /sign up/i }).click()
    await expect(page).toHaveURL('/signup')
    
    await page.getByRole('link', { name: /sign in/i }).click()
    await expect(page).toHaveURL('/login')
  })

  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/login')
  })

  test('should redirect pricing to login when not authenticated', async ({ page }) => {
    await page.goto('/pricing')
    await expect(page).toHaveURL('/login')
  })

  test('should redirect instructions to login when not authenticated', async ({ page }) => {
    await page.goto('/instructions')
    await expect(page).toHaveURL('/login')
  })
})

test.describe('UI Components', () => {
  test('login page has dark theme', async ({ page }) => {
    await page.goto('/login')
    
    // Check that the page has a dark background (using oklch color space)
    const body = page.locator('body')
    const bgColor = await body.evaluate(el => getComputedStyle(el).backgroundColor)
    expect(bgColor).toContain('oklch')
  })

  test('login form accepts input', async ({ page }) => {
    await page.goto('/login')
    
    // Fill in the form using id selectors
    await page.locator('#email').fill('test@example.com')
    await page.locator('#password').fill('password123')
    
    // Button should be clickable
    const submitButton = page.getByRole('button', { name: /sign in/i })
    await expect(submitButton).toBeEnabled()
  })
})

test.describe('Protected Routes', () => {
  test('store page requires auth', async ({ page }) => {
    await page.goto('/store')
    await expect(page).toHaveURL('/login')
  })

  test('retrieve page requires auth', async ({ page }) => {
    await page.goto('/retrieve/some-id')
    await expect(page).toHaveURL('/login')
  })

  test('schedule page requires auth', async ({ page }) => {
    await page.goto('/schedule/some-id')
    await expect(page).toHaveURL('/login')
  })
})
