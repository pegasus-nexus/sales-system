import re

# 1. Update User model
with open('backend/app/domain/models/user.py', 'r', encoding='utf-8') as f:
    user_content = f.read()

if 'permisos_especiales' not in user_content:
    from_typing = 'from typing import Optional'
    if 'List' not in user_content:
        user_content = user_content.replace(from_typing, 'from typing import Optional, List')
    
    user_content = user_content.replace('created_at: datetime = Field(default_factory=datetime.utcnow)', '''permisos_especiales: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)''')
    
    with open('backend/app/domain/models/user.py', 'w', encoding='utf-8') as f:
        f.write(user_content)
    print("Patched user.py model")

# 2. Update schemas in users.py
with open('backend/app/api/v1/endpoints/users.py', 'r', encoding='utf-8') as f:
    users_api_content = f.read()

if 'permisos_especiales' not in users_api_content:
    # CajeroCreate
    users_api_content = users_api_content.replace('role: Optional[str] = "CAJERO"', '''role: Optional[str] = "CAJERO"
    permisos_especiales: Optional[List[str]] = Field(default_factory=list)''')
    
    # EmployeeUpdate
    users_api_content = users_api_content.replace('password: Optional[str] = None', '''password: Optional[str] = None
    permisos_especiales: Optional[List[str]] = None''')
    
    # UserResponse
    users_api_content = users_api_content.replace('role: UserRole', '''role: UserRole
    permisos_especiales: List[str] = []''')
    
    # Handle the assignment in create_cajero
    create_assign = '''hashed_password=get_password_hash(data.password),
        tenant_id=current_user.tenant_id,
        sucursal_id=current_user.sucursal_id,
        role=data.role'''
    create_assign_new = '''hashed_password=get_password_hash(data.password),
        tenant_id=current_user.tenant_id,
        sucursal_id=current_user.sucursal_id,
        role=data.role,
        permisos_especiales=data.permisos_especiales or []'''
    users_api_content = users_api_content.replace(create_assign, create_assign_new)

    # Handle the assignment in update_employee
    update_block = '''if data.role:
        target_user.role = UserRole(data.role)'''
    update_block_new = '''if data.role:
        target_user.role = UserRole(data.role)
    if data.permisos_especiales is not None:
        target_user.permisos_especiales = data.permisos_especiales'''
    users_api_content = users_api_content.replace(update_block, update_block_new)
    
    with open('backend/app/api/v1/endpoints/users.py', 'w', encoding='utf-8') as f:
        f.write(users_api_content)
    print("Patched users.py schemas")

