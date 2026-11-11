<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\HasMany;
class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];
    public function roles(): BelongsToMany
{
    return $this->belongsToMany(Role::class);
}

public function hasRole(string $role): bool
{
    return $this->roles()
        ->where('slug', $role)
        ->exists();
}
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function assignedSecurityAlerts(): HasMany
{
    return $this->hasMany(SecurityAlert::class, 'assigned_to');
}


public function pentestTargets(): HasMany
{
    return $this->hasMany(PentestTarget::class);
}

public function approvedPentestTargets(): HasMany
{
    return $this->hasMany(
        PentestTarget::class,
        'approved_by'
    );
}
public function labSessions(): HasMany
{
    return $this->hasMany(LabSession::class);
}
}
