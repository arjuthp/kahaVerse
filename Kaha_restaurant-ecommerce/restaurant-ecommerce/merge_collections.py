#!/usr/bin/env python3
"""
Merge all individual Postman collections into one comprehensive test suite
"""
import json
import os

def merge_postman_collections():
    base_path = '/home/kali/Documents/KAHA_Verse/Kaha_restaurant-ecommerce/restaurant-ecommerce/postman'
    output_path = '/home/kali/Documents/KAHA_Verse/Kaha_restaurant-ecommerce/restaurant-ecommerce/KAHA_Restaurant_Complete_Tests.postman_collection.json'
    
    # Modules to merge in order
    modules = ['Categories', 'Menu', 'Addons', 'AddonGroups', 'Cart', 'Orders', 'MenuRatings']
    
    # Base collection structure
    complete_collection = {
        "info": {
            "name": "KAHA Restaurant - Complete CRUD & Edge Cases Tests",
            "description": "Comprehensive testing suite with all modules: Categories, Menu, Addons, Addon Groups, Cart, Orders, and Menu Ratings. Includes all CRUD operations, edge cases, validation tests, and error scenarios.",
            "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
            "_postman_id": "kaha-complete-tests-v1",
            "version": "1.0.0"
        },
        "auth": {
            "type": "bearer",
            "bearer": [
                {
                    "key": "token",
                    "value": "{{authToken}}",
                    "type": "string"
                }
            ]
        },
        "variable": [
            {"key": "baseUrl", "value": "http://localhost:3001/api/v1", "type": "string"},
            {"key": "authToken", "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXItbW9jay0wMDEiLCJrYWhhSWQiOiJrYWhhLW1vY2stMDAxIiwiYnVzaW5lc3NJZCI6ImJpei1tb2NrLTAwMSIsImlhdCI6MTYxNjIzOTAyMn0.mock_signature", "type": "string"},
            {"key": "adminToken", "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluLW1vY2stMDAxIiwia2FoYUlkIjoia2FoYS1hZG1pbi0wMDEiLCJidXNpbmVzc0lkIjoiYml6LW1vY2stMDAxIiwicm9sZSI6IkJVU0lORVNTX1NVUEVSX0FETUlOIiwiaWF0IjoxNjE2MjM5MDIyfQ.mock_admin_signature", "type": "string"},
            {"key": "businessId", "value": "biz-mock-001", "type": "string"},
            {"key": "userId", "value": "user-mock-001", "type": "string"},
            {"key": "categoryId", "value": "", "type": "string"},
            {"key": "menuId", "value": "", "type": "string"},
            {"key": "addonId", "value": "", "type": "string"},
            {"key": "addonGroupId", "value": "", "type": "string"},
            {"key": "cartId", "value": "", "type": "string"},
            {"key": "cartItemId", "value": "", "type": "string"},
            {"key": "orderId", "value": "", "type": "string"},
            {"key": "ratingId", "value": "", "type": "string"}
        ],
        "item": []
    }
    
    # Add health check
    health_check = {
        "name": "🏥 Health Check",
        "item": [
            {
                "name": "GET - Health Check",
                "event": [
                    {
                        "listen": "test",
                        "script": {
                            "type": "text/javascript",
                            "exec": [
                                "pm.test('Status code is 200', function() {",
                                "    pm.response.to.have.status(200);",
                                "});"
                            ]
                        }
                    }
                ],
                "request": {
                    "method": "GET",
                    "header": [],
                    "url": {
                        "raw": "{{baseUrl}}",
                        "host": ["{{baseUrl}}"]
                    }
                },
                "response": []
            }
        ]
    }
    complete_collection["item"].append(health_check)
    
    # Load and merge each module
    for module in modules:
        try:
            file_path = os.path.join(base_path, f'{module}.postman_collection.json')
            with open(file_path, 'r') as f:
                data = json.load(f)
                
                # Create a folder for this module
                module_folder = {
                    "name": data['info']['name'],
                    "item": data.get('item', [])
                }
                
                complete_collection["item"].append(module_folder)
                print(f'✓ Merged {module}: {len(data.get("item", []))} test cases')
                
        except Exception as e:
            print(f'✗ Error loading {module}: {e}')
    
    # Write the complete collection
    with open(output_path, 'w') as f:
        json.dump(complete_collection, f, indent=2)
    
    print(f'\n✓ Complete collection created: {output_path}')
    print(f'  Total modules: {len(complete_collection["item"])}')
    print(f'  Total test cases: {sum(len(item.get("item", [])) for item in complete_collection["item"])}')

if __name__ == '__main__':
    merge_postman_collections()
