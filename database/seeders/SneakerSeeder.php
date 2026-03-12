<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Gender;
use App\Models\Color;
use App\Models\Size;
use App\Models\Product;
use App\Models\ProductVariant;

class SneakerSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Core Lookups (Same as before)
        $brands = [
            'Nike' => 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg',
            'Adidas' => 'https://upload.wikimedia.org/wikipedia/commons/2/20/Adidas_Logo.svg',
            'Jordan' => 'https://upload.wikimedia.org/wikipedia/en/3/37/Jumpman_logo.svg',
            'New Balance' => 'https://upload.wikimedia.org/wikipedia/commons/e/ea/New_Balance_logo.svg',
        ];

        $brandModels = [];
        foreach ($brands as $name => $logo) {
            $brandModels[$name] = Brand::updateOrCreate(['name' => $name], ['logo_url' => $logo]);
        }

        $categories = ['Lifestyle', 'Basketball', 'Running', 'Skateboarding'];
        $catModels = [];
        foreach ($categories as $name) {
            $catModels[$name] = Category::updateOrCreate(['name' => $name]);
        }

        $genders = ['Men', 'Women', 'Unisex'];
        $genModels = [];
        foreach ($genders as $name) {
            $genModels[$name] = Gender::updateOrCreate(['name' => $name]);
        }

        $colorModels = [
            'Triple White' => Color::updateOrCreate(['name' => 'Triple White'], ['hex_code' => '#FFFFFF']),
            'Core Black' => Color::updateOrCreate(['name' => 'Core Black'], ['hex_code' => '#000000']),
            'University Red' => Color::updateOrCreate(['name' => 'University Red'], ['hex_code' => '#BD1220']),
            'Cool Grey' => Color::updateOrCreate(['name' => 'Cool Grey'], ['hex_code' => '#8C8C8C']),
            'Royal Blue' => Color::updateOrCreate(['name' => 'Royal Blue'], ['hex_code' => '#002366']),
        ];

        $sizeModels = [];
        for ($i = 4; $i <= 13; $i += 0.5) {
            $val = "US $i";
            $sizeModels[$val] = Size::updateOrCreate(['size_value' => $val]);
        }

        // 2. The Full 36-Product Catalog
        $productsData = [
            // --- NIKE (9 Products) ---
            ['brand' => 'Nike', 'cat' => 'Lifestyle', 'gen' => 'Unisex', 'name' => 'Air Force 1 Low', 'price' => 110.00, 'img' => 'https://images.nike.com/is/image/DotCom/CW2288_111_A_PREM'],
            ['brand' => 'Nike', 'cat' => 'Running', 'gen' => 'Men', 'name' => 'Air Max DN', 'price' => 160.00, 'img' => 'https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/91404177-3305-4c07-a5ec-31da859670f8/AIR+MAX+Dn.png'],
            ['brand' => 'Nike', 'cat' => 'Skateboarding', 'gen' => 'Unisex', 'name' => 'SB Dunk Low Pro', 'price' => 115.00, 'img' => 'https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/67160759-32d5-45d4-8d99-56839b252df8/SB+DUNK+LOW+PRO.png'],
            ['brand' => 'Nike', 'cat' => 'Running', 'gen' => 'Women', 'name' => 'Pegasus 40', 'price' => 130.00, 'img' => 'https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/9707b660-3118-473d-986c-0fc8e815e985/AIR+ZOOM+PEGASUS+40.png'],
            ['brand' => 'Nike', 'cat' => 'Basketball', 'gen' => 'Men', 'name' => 'Kobe 6 Protro', 'price' => 190.00, 'img' => 'https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/180295da-7f6a-4958-8120-008104ec03b7/KOBE+6+PROTRO.png'],
            ['brand' => 'Nike', 'cat' => 'Lifestyle', 'gen' => 'Unisex', 'name' => 'Air Max 90', 'price' => 130.00, 'img' => 'https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/wunmo7v8ct69nre0asre/AIR+MAX+90.png'],
            ['brand' => 'Nike', 'cat' => 'Lifestyle', 'gen' => 'Women', 'name' => 'Blazer Mid 77', 'price' => 105.00, 'img' => 'https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/fb74e643-43c2-4a0b-93f4-3860454316d3/BLAZER+MID+%2777+VINTAGE.png'],
            ['brand' => 'Nike', 'cat' => 'Basketball', 'gen' => 'Men', 'name' => 'LeBron 21', 'price' => 200.00, 'img' => 'https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/e9535359-2708-410a-839f-43b9e4a3c103/LEBRON+XXI.png'],
            ['brand' => 'Nike', 'cat' => 'Lifestyle', 'gen' => 'Unisex', 'name' => 'Vomero 5', 'price' => 160.00, 'img' => 'https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/55f2f454-94c3-49a7-96a6-0965d19c4380/AIR+ZOOM+VOMERO+5.png'],

            // --- ADIDAS (9 Products) ---
            ['brand' => 'Adidas', 'cat' => 'Lifestyle', 'gen' => 'Women', 'name' => 'Samba OG', 'price' => 100.00, 'img' => 'https://assets.adidas.com/images/h_840,f_auto,q_auto,fl_lossy,c_fill,g_auto/3bb35ad37ad74f37bcbaab30004ca601_9366/Samba_OG_Shoes_White_B75806_01_standard.jpg'],
            ['brand' => 'Adidas', 'cat' => 'Running', 'gen' => 'Unisex', 'name' => 'Ultraboost Light', 'price' => 190.00, 'img' => 'https://assets.adidas.com/images/h_840,f_auto,q_auto,fl_lossy,c_fill,g_auto/HQ6339_01_standard.jpg'],
            ['brand' => 'Adidas', 'cat' => 'Lifestyle', 'gen' => 'Unisex', 'name' => 'Gazelle Indoor', 'price' => 120.00, 'img' => 'https://assets.adidas.com/images/h_840,f_auto,q_auto,fl_lossy,c_fill,g_auto/ef9a928e75e94b05a746af48010360a0_9366/Gazelle_Indoor_Shoes_Blue_H06259_01_standard.jpg'],
            ['brand' => 'Adidas', 'cat' => 'Lifestyle', 'gen' => 'Men', 'name' => 'Superstar XLG', 'price' => 110.00, 'img' => 'https://assets.adidas.com/images/h_840,f_auto,q_auto,fl_lossy,c_fill,g_auto/887754402660438096f4af48010360a0_9366/Superstar_XLG_Shoes_White_IG9777_01_standard.jpg'],
            ['brand' => 'Adidas', 'cat' => 'Lifestyle', 'gen' => 'Women', 'name' => 'Forum Low', 'price' => 100.00, 'img' => 'https://assets.adidas.com/images/h_840,f_auto,q_auto,fl_lossy,c_fill,g_auto/6f9a928e75e94b05a746af48010360a0_9366/Forum_Low_Shoes_White_FY7757_01_standard.jpg'],
            ['brand' => 'Adidas', 'cat' => 'Running', 'gen' => 'Unisex', 'name' => 'Adizero Adios Pro 3', 'price' => 250.00, 'img' => 'https://assets.adidas.com/images/h_840,f_auto,q_auto,fl_lossy,c_fill,g_auto/81f9a928e75e94b05a746af48010360a0_9366/Adizero_Adios_Pro_3_Shoes_Black_GX9777_01_standard.jpg'],
            ['brand' => 'Adidas', 'cat' => 'Basketball', 'gen' => 'Men', 'name' => 'AE 1 With You', 'price' => 120.00, 'img' => 'https://assets.adidas.com/images/h_840,f_auto,q_auto,fl_lossy,c_fill,g_auto/2f9a928e75e94b05a746af48010360a0_9366/AE_1_With_You_Shoes_Black_IF1859_01_standard.jpg'],
            ['brand' => 'Adidas', 'cat' => 'Skateboarding', 'gen' => 'Unisex', 'name' => 'Campus 00s', 'price' => 110.00, 'img' => 'https://assets.adidas.com/images/h_840,f_auto,q_auto,fl_lossy,c_fill,g_auto/d1f9a928e75e94b05a746af48010360a0_9366/Campus_00s_Shoes_Grey_HQ8707_01_standard.jpg'],
            ['brand' => 'Adidas', 'cat' => 'Lifestyle', 'gen' => 'Men', 'name' => 'NMD_R1 V3', 'price' => 170.00, 'img' => 'https://assets.adidas.com/images/h_840,f_auto,q_auto,fl_lossy,c_fill,g_auto/f1f9a928e75e94b05a746af48010360a0_9366/NMD_R1_V3_Shoes_Black_GX3378_01_standard.jpg'],

            // --- JORDAN (9 Products) ---
            ['brand' => 'Jordan', 'cat' => 'Basketball', 'gen' => 'Men', 'name' => 'Air Jordan 4 Retro', 'price' => 215.00, 'img' => 'https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/180295da-7f6a-4958-8120-008104ec03b7/AIR+JORDAN+4+RETRO.png'],
            ['brand' => 'Jordan', 'cat' => 'Lifestyle', 'gen' => 'Women', 'name' => 'Air Jordan 1 Elevate', 'price' => 145.00, 'img' => 'https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/8c6ec35b-80a5-442f-90e9-b59c7d413e17/AIR+JORDAN+1+ELEVATE+LOW.png'],
            ['brand' => 'Jordan', 'cat' => 'Lifestyle', 'gen' => 'Unisex', 'name' => 'Air Jordan 1 High OG', 'price' => 180.00, 'img' => 'https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/fb74e643-43c2-4a0b-93f4-3860454316d3/AIR+JORDAN+1+RETRO+HIGH+OG.png'],
            ['brand' => 'Jordan', 'cat' => 'Lifestyle', 'gen' => 'Men', 'name' => 'Air Jordan 3 Retro', 'price' => 210.00, 'img' => 'https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/e9535359-2708-410a-839f-43b9e4a3c103/AIR+JORDAN+3+RETRO.png'],
            ['brand' => 'Jordan', 'cat' => 'Basketball', 'gen' => 'Unisex', 'name' => 'Air Jordan 11 Retro', 'price' => 230.00, 'img' => 'https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/55f2f454-94c3-49a7-96a6-0965d19c4380/AIR+JORDAN+11+RETRO.png'],
            ['brand' => 'Jordan', 'cat' => 'Basketball', 'gen' => 'Men', 'name' => 'Luka 2', 'price' => 130.00, 'img' => 'https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/480295da-7f6a-4958-8120-008104ec03b7/LUKA+2.png'],
            ['brand' => 'Jordan', 'cat' => 'Basketball', 'gen' => 'Men', 'name' => 'Tatum 2', 'price' => 125.00, 'img' => 'https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/580295da-7f6a-4958-8120-008104ec03b7/TATUM+2.png'],
            ['brand' => 'Jordan', 'cat' => 'Lifestyle', 'gen' => 'Women', 'name' => 'Air Jordan 1 Low', 'price' => 115.00, 'img' => 'https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/680295da-7f6a-4958-8120-008104ec03b7/AIR+JORDAN+1+LOW.png'],
            ['brand' => 'Jordan', 'cat' => 'Lifestyle', 'gen' => 'Men', 'name' => 'Jordan Spizike Low', 'price' => 160.00, 'img' => 'https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/780295da-7f6a-4958-8120-008104ec03b7/JORDAN+SPIZIKE+LOW.png'],

            // --- NEW BALANCE (9 Products) ---
            ['brand' => 'New Balance', 'cat' => 'Lifestyle', 'gen' => 'Unisex', 'name' => 'NB 2002R', 'price' => 140.00, 'img' => 'https://nb.scene7.com/is/image/NB/m2002rec_nb_02_i?$pdp_main_v7$'],
            ['brand' => 'New Balance', 'cat' => 'Lifestyle', 'gen' => 'Men', 'name' => 'NB 550', 'price' => 120.00, 'img' => 'https://nb.scene7.com/is/image/NB/bb550wtg_nb_02_i?$pdp_main_v7$'],
            ['brand' => 'New Balance', 'cat' => 'Lifestyle', 'gen' => 'Unisex', 'name' => 'NB 990v6 Made in USA', 'price' => 200.00, 'img' => 'https://nb.scene7.com/is/image/NB/u990gl6_nb_02_i?$pdp_main_v7$'],
            ['brand' => 'New Balance', 'cat' => 'Lifestyle', 'gen' => 'Men', 'name' => 'NB 1906R', 'price' => 155.00, 'img' => 'https://nb.scene7.com/is/image/NB/m1906re_nb_02_i?$pdp_main_v7$'],
            ['brand' => 'New Balance', 'cat' => 'Lifestyle', 'gen' => 'Women', 'name' => 'NB 530', 'price' => 100.00, 'img' => 'https://nb.scene7.com/is/image/NB/mr530sg_nb_02_i?$pdp_main_v7$'],
            ['brand' => 'New Balance', 'cat' => 'Running', 'gen' => 'Unisex', 'name' => 'Fresh Foam 1080', 'price' => 165.00, 'img' => 'https://nb.scene7.com/is/image/NB/m1080v13_nb_02_i?$pdp_main_v7$'],
            ['brand' => 'New Balance', 'cat' => 'Basketball', 'gen' => 'Men', 'name' => 'TWO WXY V4', 'price' => 120.00, 'img' => 'https://nb.scene7.com/is/image/NB/bb2wybk4_nb_02_i?$pdp_main_v7$'],
            ['brand' => 'New Balance', 'cat' => 'Skateboarding', 'gen' => 'Unisex', 'name' => 'NB 480', 'price' => 90.00, 'img' => 'https://nb.scene7.com/is/image/NB/bb480lgt_nb_02_i?$pdp_main_v7$'],
            ['brand' => 'New Balance', 'cat' => 'Lifestyle', 'gen' => 'Women', 'name' => 'NB 9060', 'price' => 150.00, 'img' => 'https://nb.scene7.com/is/image/NB/u9060hsb_nb_02_i?$pdp_main_v7$'],
        ];

        // 3. Create Products and Variants
        foreach ($productsData as $p) {
            $product = Product::create([
                'brand_id' => $brandModels[$p['brand']]->id,
                'category_id' => $catModels[$p['cat']]->id,
                'gender_id' => $genModels[$p['gen']]->id,
                'name' => $p['name'],
                'description' => "The classic {$p['name']} from {$p['brand']}. Designed for the ultimate mix of performance and heritage style.",
                'base_price' => $p['price'],
                'main_image_url' => $p['img'],
                'is_active' => true,
            ]);

            // Randomly select 2 colors for this product
            $colorKeys = array_rand($colorModels, 2);
            $selectedSizes = ['US 8', 'US 9', 'US 10', 'US 11', 'US 12'];

            foreach ($colorKeys as $colorName) {
                foreach ($selectedSizes as $sizeVal) {
                    ProductVariant::create([
                        'product_id' => $product->id,
                        'color_id' => $colorModels[$colorName]->id,
                        'size_id' => $sizeModels[$sizeVal]->id,
                        'stock_quantity' => rand(10, 50),
                    ]);
                }
            }
        }
    }
}
