import {Component} from "lagom-engine";

export class Health extends Component
{
    constructor(private maxHealth: number, private currentHealth: number)
    {
        super();
    }

    isEmpty()
    {
        return this.currentHealth <= this.maxHealth;
    }

    getCurrentHealth()
    {
        return this.currentHealth;
    }

    getMaxHealth()
    {
        return this.maxHealth;
    }

    getPercentageRemaining()
    {
        return this.currentHealth / this.maxHealth * 100;
    }

    addHealth(amount: number)
    {
        this.currentHealth += amount;
        if (this.currentHealth > this.maxHealth)
        {
            this.currentHealth = this.maxHealth;
        }
    }

    removeHealth(amount: number)
    {
        this.currentHealth -= amount;
        if (this.currentHealth < 0)
        {
            this.currentHealth = 0;
        }
    }
}
