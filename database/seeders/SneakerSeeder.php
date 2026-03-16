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
        // 1. Core Lookups (Idempotent)
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

        // 2. Image URL Mapping
        // TIP: Run the Tinker command I gave you and paste the output here to sync with your DB
        $imageMap = [
            'Air Force 1 Low' => 'https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/b7d9211c-26e7-431a-ac24-b0540fb3c00f/AIR+FORCE+1+%2707.png',
            'Air Max DN' => 'https://static.nike.com/a/images/t_web_pdp_535_v2/f_auto,u_9ddf04c7-2a9a-4d76-add1-d15af8f0263d,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/a7669850-83c6-425a-b5da-027cce722c54/AIR+MAX+DN8+LTHR.png',
            'SB Dunk Low Pro' => 'https://static.nike.com/a/images/t_web_pdp_535_v2/f_auto,u_9ddf04c7-2a9a-4d76-add1-d15af8f0263d,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/986bcf87-f594-4ec4-a015-f0d63a78a6ee/NIKE+SB+DUNK+LOW+PRO.png',
            'Pegasus 40' => 'https://static.nike.com/a/images/t_web_pdp_535_v2/f_auto,u_9ddf04c7-2a9a-4d76-add1-d15af8f0263d,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/0aacbcdc-2ec7-4ae7-97dc-e8a9b13892c9/W+AIR+ZOOM+PEGASUS+41+WIDE.png',
            'Kobe 6 Protro' => 'https://static.nike.com/a/images/w_1280,q_auto,f_auto/dcaa4fd5-5678-4c85-820c-71796481854d/%E0%B8%A7%E0%B8%B1%E0%B8%99%E0%B9%80%E0%B8%9B%E0%B8%B4%E0%B8%94%E0%B8%95%E0%B8%B1%E0%B8%A7-kobe-6-protro-3d-iq3902-002.jpg',
            'Air Max 90' => 'https://static.nike.com/a/images/t_web_pdp_535_v2/f_auto,u_9ddf04c7-2a9a-4d76-add1-d15af8f0263d,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/1d2f8b17-66b8-4e13-ad6b-329e14eb04ac/AIR+MAX+90+%28GS%29.png',
            'Blazer Mid 77' => 'https://static.nike.com/a/images/t_web_pdp_535_v2/f_auto,u_9ddf04c7-2a9a-4d76-add1-d15af8f0263d,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/fb7eda3c-5ac8-4d05-a18f-1c2c5e82e36e/BLAZER+MID+%2777+VNTG.png',
            'LeBron 21' => 'https://static.nike.com/a/images/t_web_pdp_535_v2/f_auto,u_9ddf04c7-2a9a-4d76-add1-d15af8f0263d,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/fd5e2eb3-a2c8-49c8-b038-bffc53943830/LEBRON+XXIII+EP.png',
            'Vomero 5' => 'https://static.nike.com/a/images/t_web_pdp_535_v2/f_auto,u_9ddf04c7-2a9a-4d76-add1-d15af8f0263d,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/532441e1-8845-4be4-88d0-402d6823491b/W+NIKE+ZOOM+VOMERO+5.png',
            'Samba OG' => 'https://assets.adidas.com/images/h_2000,f_auto,q_auto,fl_lossy,c_fill,g_auto/3bbecbdf584e40398446a8bf0117cf62_9366/Samba_OG_B75806_01_00_standard.jpg',
            'Ultraboost Light' => 'https://assets.adidas.com/images/h_2000,f_auto,q_auto,fl_lossy,c_fill,g_auto/dcec389907c14ef4aed71025d86dd31b_9366/Ultraboost_5x_JQ9086_01_00_standard.jpg',
            'Gazelle Indoor' => 'https://assets.adidas.com/images/h_2000,f_auto,q_auto,fl_lossy,c_fill,g_auto/9edda2ae22e442059060a6ad829ea1dd_9366/GAZELLE_INDOOR_IH9641_01_00_standard.jpg',
            'Superstar XLG' => 'https://assets.adidas.com/images/h_2000,f_auto,q_auto,fl_lossy,c_fill,g_auto/a854843643c7465f84522a4507d918ea_9366/Superstar_XLG_IF3691_01_standard.jpg',
            'Forum Low' => 'https://assets.adidas.com/images/h_2000,f_auto,q_auto,fl_lossy,c_fill,g_auto/06240f53677c467cadff1736ff076387_9366/Forum_Low_CL_IH7914_01_standard.jpg',
            'Adizero Adios Pro 3' => 'https://assets.adidas.com/images/h_2000,f_auto,q_auto,fl_lossy,c_fill,g_auto/d97e80435f9442c885c4d7321c05876b_9366/ADIZERO_ADIOS_PRO_3_IG6439_HM1.jpg',
            'AE 1 With You' => 'https://assets.adidas.com/images/h_2000,f_auto,q_auto,fl_lossy,c_fill,g_auto/4be4f0677683403c929f5eb1b38682a4_9366/ANTHONY_EDWARDS_2_JQ9493_01_00_standard.jpg',
            'Campus 00s' => 'https://assets.adidas.com/images/h_2000,f_auto,q_auto,fl_lossy,c_fill,g_auto/b0b6d4a107ad4e84b3baaf8700866f07_9366/Campus_00s_H03472_01_standard.jpg',
            'NMD_R1 V3' => 'https://assets.adidas.com/images/w_600,f_auto,q_auto/62d96641e799450fbbdfad0800cb06ed_9366/NMD_R1_GZ9256_01_standard.jpg',
            'Air Jordan 4 Retro' => 'https://static.nike.com/a/images/t_web_pw_592_v2/f_auto/u_126ab356-44d8-4a06-89b4-fcdcc8df0245,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/dc4c3f84-88b0-48ee-b13a-28e4ee39a696/WMNS+AIR+JORDAN+4+RETRO.png',
            'Air Jordan 1 Elevate' => 'https://d2cva83hdk3bwc.cloudfront.net/jordan-wmns-air-jordan-1-elevate-low-stealth-1.jpg',
            'Air Jordan 1 High OG' => 'https://static.nike.com/a/images/t_web_pw_592_v2/f_auto/u_126ab356-44d8-4a06-89b4-fcdcc8df0245,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/8a068559-3d41-4442-a0c0-792b7ffef5cb/AIR+JORDAN+1+RETRO+HIGH+OG.png',
            'Air Jordan 3 Retro' => 'https://static.nike.com/a/images/w_1280,q_auto,f_auto/39e31d53-a5f9-425a-95f5-ec25afe9b8d1/%E0%B8%A7%E0%B8%B1%E0%B8%99%E0%B9%80%E0%B8%9B%E0%B8%B4%E0%B8%94%E0%B8%95%E0%B8%B1%E0%B8%A7-air-jordan-3-el-vuelo-summit-white-and-pine-green-io1752-100.jpg',
            'Air Jordan 11 Retro' => 'https://static.nike.com/a/images/t_web_pw_592_v2/f_auto/u_126ab356-44d8-4a06-89b4-fcdcc8df0245,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/93622545-f24e-457f-bfad-1f624cd51d9c/AIR+JORDAN+11+RETRO+RA.png',
            'Luka 2' => 'https://static.nike.com/a/images/t_web_pdp_535_v2/f_auto,u_126ab356-44d8-4a06-89b4-fcdcc8df0245,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/35b83b9c-7c06-4872-af39-d35267c5491d/JORDAN+LUKA+2+PF.png',
            'Tatum 2' => 'https://static.nike.com/a/images/t_web_pdp_535_v2/f_auto,u_126ab356-44d8-4a06-89b4-fcdcc8df0245,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/045f02ac-c942-4b3d-aa49-4e7001afe94a/JORDAN+TATUM+4+PF.png',
            'Air Jordan 1 Low' => 'https://static.nike.com/a/images/t_web_pdp_535_v2/f_auto,u_126ab356-44d8-4a06-89b4-fcdcc8df0245,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/b6a2141f-c081-4528-8f43-ce087e0dab8f/AIR+JORDAN+1+LOW.png',
            'Jordan Spizike Low' => 'https://static.nike.com/a/images/t_web_pdp_535_v2/f_auto,u_126ab356-44d8-4a06-89b4-fcdcc8df0245,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/7592c1ff-7fa3-4f97-9fcf-9b581e73ce25/JORDAN+SPIZIKE+LOW.png',
            'NB 2002R' => 'https://nb.scene7.com/is/image/NB/m2002rec_nb_02_i?$pdp_main_v7$',
            'NB 550' => 'https://nb.scene7.com/is/image/NB/bb550wtg_nb_02_i?$pdp_main_v7$',
            'NB 990v6 Made in USA' => 'https://www.newbalance.co.th/media/catalog/product/cache/b444f50a64a092a2138a5e1cbd49879a/9/9/9991-NEWU990SG6GRE011-1.jpg',
            'NB 1906R' => 'https://nb.scene7.com/is/image/NB/m1906re_nb_02_i?$pdp_main_v7$',
            'NB 530' => 'https://nb.scene7.com/is/image/NB/mr530sg_nb_02_i?$pdp_main_v7$',
            'Fresh Foam 1080' => 'https://www.newbalance.co.th/media/catalog/product/cache/b444f50a64a092a2138a5e1cbd49879a/9/9/9991-NEWM4105G0GRE11H-1.jpg',
            'TWO WXY V4' => 'https://nb.scene7.com/is/image/NB/bb2wybk4_nb_02_i?$pdp_main_v7$',
            'NB 480' => 'https://nb.scene7.com/is/image/NB/bb480lgt_nb_02_i?$pdp_main_v7$',
            'NB 9060' => 'https://nb.scene7.com/is/image/NB/u9060hsb_nb_02_i?$pdp_main_v7$',
        ];

        // 3. Product Catalog
        $productsData = [
            ['brand' => 'Nike', 'cat' => 'Lifestyle', 'gen' => 'Unisex', 'name' => 'Air Force 1 Low', 'price' => 110.00],
            ['brand' => 'Nike', 'cat' => 'Running', 'gen' => 'Men', 'name' => 'Air Max DN', 'price' => 160.00],
            ['brand' => 'Nike', 'cat' => 'Skateboarding', 'gen' => 'Unisex', 'name' => 'SB Dunk Low Pro', 'price' => 115.00],
            ['brand' => 'Nike', 'cat' => 'Running', 'gen' => 'Women', 'name' => 'Pegasus 40', 'price' => 130.00],
            ['brand' => 'Nike', 'cat' => 'Basketball', 'gen' => 'Men', 'name' => 'Kobe 6 Protro', 'price' => 190.00],
            ['brand' => 'Nike', 'cat' => 'Lifestyle', 'gen' => 'Unisex', 'name' => 'Air Max 90', 'price' => 130.00],
            ['brand' => 'Nike', 'cat' => 'Lifestyle', 'gen' => 'Women', 'name' => 'Blazer Mid 77', 'price' => 105.00],
            ['brand' => 'Nike', 'cat' => 'Basketball', 'gen' => 'Men', 'name' => 'LeBron 21', 'price' => 200.00],
            ['brand' => 'Nike', 'cat' => 'Lifestyle', 'gen' => 'Unisex', 'name' => 'Vomero 5', 'price' => 160.00],
            ['brand' => 'Adidas', 'cat' => 'Lifestyle', 'gen' => 'Women', 'name' => 'Samba OG', 'price' => 100.00],
            ['brand' => 'Adidas', 'cat' => 'Running', 'gen' => 'Unisex', 'name' => 'Ultraboost Light', 'price' => 190.00],
            ['brand' => 'Adidas', 'cat' => 'Lifestyle', 'gen' => 'Unisex', 'name' => 'Gazelle Indoor', 'price' => 120.00],
            ['brand' => 'Adidas', 'cat' => 'Lifestyle', 'gen' => 'Men', 'name' => 'Superstar XLG', 'price' => 110.00],
            ['brand' => 'Adidas', 'cat' => 'Lifestyle', 'gen' => 'Women', 'name' => 'Forum Low', 'price' => 100.00],
            ['brand' => 'Adidas', 'cat' => 'Running', 'gen' => 'Unisex', 'name' => 'Adizero Adios Pro 3', 'price' => 250.00],
            ['brand' => 'Adidas', 'cat' => 'Basketball', 'gen' => 'Men', 'name' => 'AE 1 With You', 'price' => 120.00],
            ['brand' => 'Adidas', 'cat' => 'Skateboarding', 'gen' => 'Unisex', 'name' => 'Campus 00s', 'price' => 110.00],
            ['brand' => 'Adidas', 'cat' => 'Lifestyle', 'gen' => 'Men', 'name' => 'NMD_R1 V3', 'price' => 170.00],
            ['brand' => 'Jordan', 'cat' => 'Basketball', 'gen' => 'Men', 'name' => 'Air Jordan 4 Retro', 'price' => 215.00],
            ['brand' => 'Jordan', 'cat' => 'Lifestyle', 'gen' => 'Women', 'name' => 'Air Jordan 1 Elevate', 'price' => 145.00],
            ['brand' => 'Jordan', 'cat' => 'Lifestyle', 'gen' => 'Unisex', 'name' => 'Air Jordan 1 High OG', 'price' => 180.00],
            ['brand' => 'Jordan', 'cat' => 'Lifestyle', 'gen' => 'Men', 'name' => 'Air Jordan 3 Retro', 'price' => 210.00],
            ['brand' => 'Jordan', 'cat' => 'Basketball', 'gen' => 'Unisex', 'name' => 'Air Jordan 11 Retro', 'price' => 230.00],
            ['brand' => 'Jordan', 'cat' => 'Basketball', 'gen' => 'Men', 'name' => 'Luka 2', 'price' => 130.00],
            ['brand' => 'Jordan', 'cat' => 'Basketball', 'gen' => 'Men', 'name' => 'Tatum 2', 'price' => 125.00],
            ['brand' => 'Jordan', 'cat' => 'Lifestyle', 'gen' => 'Women', 'name' => 'Air Jordan 1 Low', 'price' => 115.00],
            ['brand' => 'Jordan', 'cat' => 'Lifestyle', 'gen' => 'Men', 'name' => 'Jordan Spizike Low', 'price' => 160.00],
            ['brand' => 'New Balance', 'cat' => 'Lifestyle', 'gen' => 'Unisex', 'name' => 'NB 2002R', 'price' => 140.00],
            ['brand' => 'New Balance', 'cat' => 'Lifestyle', 'gen' => 'Men', 'name' => 'NB 550', 'price' => 120.00],
            ['brand' => 'New Balance', 'cat' => 'Lifestyle', 'gen' => 'Unisex', 'name' => 'NB 990v6 Made in USA', 'price' => 200.00],
            ['brand' => 'New Balance', 'cat' => 'Lifestyle', 'gen' => 'Men', 'name' => 'NB 1906R', 'price' => 155.00],
            ['brand' => 'New Balance', 'cat' => 'Lifestyle', 'gen' => 'Women', 'name' => 'NB 530', 'price' => 100.00],
            ['brand' => 'New Balance', 'cat' => 'Running', 'gen' => 'Unisex', 'name' => 'Fresh Foam 1080', 'price' => 165.00],
            ['brand' => 'New Balance', 'cat' => 'Basketball', 'gen' => 'Men', 'name' => 'TWO WXY V4', 'price' => 120.00],
            ['brand' => 'New Balance', 'cat' => 'Skateboarding', 'gen' => 'Unisex', 'name' => 'NB 480', 'price' => 90.00],
            ['brand' => 'New Balance', 'cat' => 'Lifestyle', 'gen' => 'Women', 'name' => 'NB 9060', 'price' => 150.00],
        ];

        // 4. Create/Update Products and Variants
        foreach ($productsData as $p) {
            $finalImage = $imageMap[$p['name']] ?? 'https://via.placeholder.com/600';

            $product = Product::updateOrCreate(
                ['name' => $p['name']],
                [
                    'brand_id' => $brandModels[$p['brand']]->id,
                    'category_id' => $catModels[$p['cat']]->id,
                    'gender_id' => $genModels[$p['gen']]->id,
                    'description' => "The classic {$p['name']} from {$p['brand']}. Designed for the ultimate mix of performance and heritage style.",
                    'base_price' => $p['price'],
                    'main_image_url' => $finalImage,
                    'is_active' => true,
                ]
            );

            // Randomly select 2 colors for this product
            $colorKeys = array_rand($colorModels, 2);
            $selectedSizes = ['US 8', 'US 9', 'US 10', 'US 11', 'US 12'];

            foreach ($colorKeys as $colorName) {
                foreach ($selectedSizes as $sizeVal) {
                    ProductVariant::updateOrCreate(
                        [
                            'product_id' => $product->id,
                            'color_id' => $colorModels[$colorName]->id,
                            'size_id' => $sizeModels[$sizeVal]->id,
                        ],
                        [
                            'stock_quantity' => rand(10, 50),
                        ]
                    );
                }
            }
        }
    }
}
