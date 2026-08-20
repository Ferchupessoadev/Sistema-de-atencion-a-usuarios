<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $tecnico = Role::findOrCreate('tecnico', 'web');
        $representante_de_area = Role::findOrCreate('representante_de_area', 'web');
        $usuario_normal = Role::findOrCreate('default', 'web');

        $permissions = [
            // Incidentes
            'incidentes.ver',
            'incidentes.crear',
            'incidentes.actualizar',
            'incidentes.derivar',
            'incidentes.exportar',

            // Recetas
            'recetas.ver',
            'recetas.crear',
            'recetas.editar',
            'recetas.eliminar',

            // Categorías
            'categorias.ver',
            'categorias.crear',
            'categorias.editar',
            'categorias.eliminar',
        ];

        $permissionModels = collect($permissions)
            ->map(fn (string $permission) => Permission::findOrCreate($permission, 'web'));

        // Técnico: todos los permisos
        $tecnico->syncPermissions($permissionModels);

        // Representante de área: todos excepto derivar y exportar incidentes
        $representante_de_area->syncPermissions(
            $permissionModels->reject(
                fn (Permission $permission) => in_array($permission->name, [
                    'incidentes.derivar',
                    'incidentes.exportar',
                ])
            )
        );

        // Usuario normal
        $usuario_normal->syncPermissions([
            'incidentes.ver',
            'incidentes.crear',
            'recetas.ver',
            'categorias.ver',
        ]);
        $this->command->info('Roles y permisos iniciales creados correctamente.');
    }

}