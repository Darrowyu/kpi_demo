# 生产人员KPI计算程序 - 标准参数库配置
# 数据来源: 生产人员KPI算法与标准库.xlsx

# 定义中文字体
CHINESE_FONT = '微软雅黑'

# 定义颜色主题
COLOR_PRIMARY = '4472C4'      # 主色调-蓝色
COLOR_SECONDARY = '5B9BD5'    # 次要色-浅蓝
COLOR_HEADER = 'D9E1F2'       # 表头背景
COLOR_ALT_ROW = 'F2F2F2'      # 交替行背景
COLOR_GOLD = 'FFD700'         # 金色高亮
COLOR_RED = 'FF6B6B'          # 红色警示
COLOR_GREEN = '70AD47'        # 绿色优秀
COLOR_YELLOW = 'FFC000'       # 黄色警告

# 标准参数库 - 按产品型号+设备名称+工站定义（三维标准）
# 键格式: (产品型号, 设备名称, 工站)
# 设备名称为空字符串""表示该工站不区分设备
STANDARD_PARAMS = {
    # ========================================
    # 9500-N95 产品系列
    # ========================================
    ('9500-N95', '轧针机', '轧针'): {
        'standard_output': 7500,
        'standard_quality_rate': 0.99,
        'standard_rework_limit': 0.003,
        'standard_scrap_limit': 0.0005,
        'note': '100Y=5000个(人）'
    },
    ('9500-N95', '成型机', '成型'): {
        'standard_output': 2554,
        'standard_quality_rate': 0.99,
        'standard_rework_limit': 0.003,
        'standard_scrap_limit': 0.0005,
        'note': '一人四台机'
    },
    ('9500-N95', '斩内外模机', '斩内外模'): {
        'standard_output': 18750,
        'standard_quality_rate': 0.99,
        'standard_rework_limit': 0.003,
        'standard_scrap_limit': 0.0005,
        'note': '分内外模'
    },
    ('9500-N95', '打外罩机', '打外罩'): {
        'standard_output': 6260,
        'standard_quality_rate': 0.99,
        'standard_rework_limit': 0.003,
        'standard_scrap_limit': 0.0005,
        'note': '一人一台机'
    },
    ('9500-N95', '超声波斩带切机', '超声波斩带切'): {
        'standard_output': 1094,
        'standard_quality_rate': 0.99,
        'standard_rework_limit': 0.003,
        'standard_scrap_limit': 0.0005,
        'note': '一人一台机'
    },
    ('9500-N95', '移印机', '移印'): {
        'standard_output': 1680,
        'standard_quality_rate': 0.99,
        'standard_rework_limit': 0.003,
        'standard_scrap_limit': 0.0005,
        'note': '一人一台机'
    },
    ('9500-N95', '二合一焊头带/贴鼻夹机', '二合一'): {
        'standard_output': 1818,
        'standard_quality_rate': 0.99,
        'standard_rework_limit': 0.003,
        'standard_scrap_limit': 0.0005,
        'note': '一人开二台机'
    },
    ('9500-N95', '查货台', '查货'): {
        'standard_output': 1818,
        'standard_quality_rate': 0.99,
        'standard_rework_limit': 0.003,
        'standard_scrap_limit': 0.0005,
        'note': '一人查二台机'
    },
    ('9500-N95', '贴鼻垫工位', '贴鼻垫'): {
        'standard_output': 714,
        'standard_quality_rate': 0.99,
        'standard_rework_limit': 0.003,
        'standard_scrap_limit': 0.0005,
        'note': '20PCS/袋'
    },
    ('9500-N95', '封口机', '封口'): {
        'standard_output': 3130,
        'standard_quality_rate': 0.99,
        'standard_rework_limit': 0.003,
        'standard_scrap_limit': 0.0005,
        'note': '20PCS/袋'
    },
    ('9500-N95', '装箱工位', '装箱'): {
        'standard_output': 2330,
        'standard_quality_rate': 0.99,
        'standard_rework_limit': 0.003,
        'standard_scrap_limit': 0.0005,
        'note': '20PCS/盒/12盒/箱'
    },

    # ========================================
    # 9600-N95 产品系列
    # ========================================
    ('9600-N95', '轧针机', '轧针'): {
        'standard_output': 7500,
        'standard_quality_rate': 0.99,
        'standard_rework_limit': 0.003,
        'standard_scrap_limit': 0.0005,
        'note': '100Y=5000个(人）'
    },
    ('9600-N95', '成型机', '成型'): {
        'standard_output': 2554,
        'standard_quality_rate': 0.99,
        'standard_rework_limit': 0.003,
        'standard_scrap_limit': 0.0005,
        'note': '一人四台机'
    },
    ('9600-N95', '斩外模机', '斩外模'): {
        'standard_output': 18750,
        'standard_quality_rate': 0.99,
        'standard_rework_limit': 0.003,
        'standard_scrap_limit': 0.0005,
        'note': '分内外模（仅外模）'
    },
    ('9600-N95', '打外罩机', '打外罩'): {
        'standard_output': 6260,
        'standard_quality_rate': 0.99,
        'standard_rework_limit': 0.003,
        'standard_scrap_limit': 0.0005,
        'note': '一人一台机'
    },
    ('9600-N95', '超声波斩带切机', '超声波斩带切'): {
        'standard_output': 1619,
        'standard_quality_rate': 0.99,
        'standard_rework_limit': 0.003,
        'standard_scrap_limit': 0.0005,
        'note': '一人一台机（效率高于9500）'
    },
    ('9600-N95', '移印机', '移印'): {
        'standard_output': 1933,
        'standard_quality_rate': 0.99,
        'standard_rework_limit': 0.003,
        'standard_scrap_limit': 0.0005,
        'note': '一人一台机（效率高于9500）'
    },
    ('9600-N95', '二合一焊头带/贴鼻夹机', '二合一'): {
        'standard_output': 1971,
        'standard_quality_rate': 0.99,
        'standard_rework_limit': 0.003,
        'standard_scrap_limit': 0.0005,
        'note': '一人开二台机（效率高于9500）'
    },
    ('9600-N95', '查货台', '查货'): {
        'standard_output': 1971,
        'standard_quality_rate': 0.99,
        'standard_rework_limit': 0.003,
        'standard_scrap_limit': 0.0005,
        'note': '一人查二台机（效率高于9500）'
    },
    ('9600-N95', '贴鼻垫工位', '贴鼻垫'): {
        'standard_output': 691,
        'standard_quality_rate': 0.99,
        'standard_rework_limit': 0.003,
        'standard_scrap_limit': 0.0005,
        'note': '20PCS/袋（略低于9500）'
    },
    ('9600-N95', '封口机', '封口'): {
        'standard_output': 3130,
        'standard_quality_rate': 0.99,
        'standard_rework_limit': 0.003,
        'standard_scrap_limit': 0.0005,
        'note': '20PCS/袋（与9500相同）'
    },
    ('9600-N95', '手工封口机                 (脚踩式)', '封口'): {
        'standard_output': 3130,
        'standard_quality_rate': 0.99,
        'standard_rework_limit': 0.003,
        'standard_scrap_limit': 0.0005,
        'note': '手工封口作业'
    },
    ('9600-N95', '装箱工位', '装箱'): {
        'standard_output': 2756,
        'standard_quality_rate': 0.99,
        'standard_rework_limit': 0.003,
        'standard_scrap_limit': 0.0005,
        'note': '20PCS/盒/12盒/箱（高于9500）'
    },
    ('9600-N95', '', '装箱'): {
        'standard_output': 2756,
        'standard_quality_rate': 0.99,
        'standard_rework_limit': 0.003,
        'standard_scrap_limit': 0.0005,
        'note': '装箱作业（手工）'
    },
    ('9600-N95', '', '盖箱号'): {
        'standard_output': 1200,
        'standard_quality_rate': 0.99,
        'standard_rework_limit': 0.003,
        'standard_scrap_limit': 0.0005,
        'note': '盖箱号作业'
    },
    ('9600-N95', '', '包装'): {
        'standard_output': 1000,
        'standard_quality_rate': 0.99,
        'standard_rework_limit': 0.003,
        'standard_scrap_limit': 0.0005,
        'note': '包装作业'
    },
    ('9600-N95', '', '打包带'): {
        'standard_output': 800,
        'standard_quality_rate': 0.99,
        'standard_rework_limit': 0.003,
        'standard_scrap_limit': 0.0005,
        'note': '打包带作业'
    },
    ('9600-N95', '', '纸箱打两条                      黄色包装带'): {
        'standard_output': 800,
        'standard_quality_rate': 0.99,
        'standard_rework_limit': 0.003,
        'standard_scrap_limit': 0.0005,
        'note': '纸箱打包作业'
    },
    ('9600-N95', '', '装彩盒'): {
        'standard_output': 1200,
        'standard_quality_rate': 0.99,
        'standard_rework_limit': 0.003,
        'standard_scrap_limit': 0.0005,
        'note': '装彩盒作业'
    },
    ('9600-N95', '', '贴彩盒标签'): {
        'standard_output': 1000,
        'standard_quality_rate': 0.99,
        'standard_rework_limit': 0.003,
        'standard_scrap_limit': 0.0005,
        'note': '贴彩盒标签作业'
    },
    ('9600-N95', '', '返工织带'): {
        'standard_output': 500,
        'standard_quality_rate': 0.99,
        'standard_rework_limit': 0.003,
        'standard_scrap_limit': 0.0005,
        'note': '返工织带作业'
    },
    ('9600-N95', '', '返工贴标'): {
        'standard_output': 500,
        'standard_quality_rate': 0.99,
        'standard_rework_limit': 0.003,
        'standard_scrap_limit': 0.0005,
        'note': '返工贴标作业'
    },
    ('9600-N95', '9600-N95二合一', '二合一'): {
        'standard_output': 1971,
        'standard_quality_rate': 0.99,
        'standard_rework_limit': 0.003,
        'standard_scrap_limit': 0.0005,
        'note': '二合一作业'
    },
    ('9600-N95', '全自动贴片焊带机 焊头带/贴鼻夹等', '二合一'): {
        'standard_output': 1971,
        'standard_quality_rate': 0.99,
        'standard_rework_limit': 0.003,
        'standard_scrap_limit': 0.0005,
        'note': '全自动二合一作业'
    },
    ('9600-N95', '全自动贴片焊带机 焊头带/贴鼻夹等', '开机'): {
        'standard_output': 1971,
        'standard_quality_rate': 0.99,
        'standard_rework_limit': 0.003,
        'standard_scrap_limit': 0.0005,
        'note': '全自动贴片焊带机开机'
    },
    ('9600-N95', '全自动贴片焊带机 焊头带/贴鼻夹等', '查货'): {
        'standard_output': 1971,
        'standard_quality_rate': 0.99,
        'standard_rework_limit': 0.003,
        'standard_scrap_limit': 0.0005,
        'note': '全自动贴片焊带机查货'
    },
    ('9600-N95', '全自动贴片焊带机 焊头带/贴鼻夹等', '二合一'): {
        'standard_output': 1971,
        'standard_quality_rate': 0.99,
        'standard_rework_limit': 0.003,
        'standard_scrap_limit': 0.0005,
        'note': '全自动贴片焊带机二合一'
    },
    ('9600-N95', '全自动贴片焊带机 焊头带/贴鼻夹等', '开机'): {
        'standard_output': 1971,
        'standard_quality_rate': 0.99,
        'standard_rework_limit': 0.003,
        'standard_scrap_limit': 0.0005,
        'note': '全自动贴片焊带机开机'
    },
    ('9600-N95', '二合一焊头带/贴鼻夹机', '二合一'): {
        'standard_output': 1971,
        'standard_quality_rate': 0.99,
        'standard_rework_limit': 0.003,
        'standard_scrap_limit': 0.0005,
        'note': '二合一焊头带/贴鼻夹'
    },
    ('9600-N95', '二合一焊头带/贴鼻夹等', '查货'): {
        'standard_output': 1971,
        'standard_quality_rate': 0.99,
        'standard_rework_limit': 0.003,
        'standard_scrap_limit': 0.0005,
        'note': '二合一焊头带/贴鼻夹等查货'
    },
    ('9600-N95', '二合一焊头带/贴鼻夹等', '开机'): {
        'standard_output': 1971,
        'standard_quality_rate': 0.99,
        'standard_rework_limit': 0.003,
        'standard_scrap_limit': 0.0005,
        'note': '二合一焊头带/贴鼻夹等开机'
    },
    ('9600-N95', '9600-N95二合一', '二合一'): {
        'standard_output': 1971,
        'standard_quality_rate': 0.99,
        'standard_rework_limit': 0.003,
        'standard_scrap_limit': 0.0005,
        'note': '9600-N95二合一'
    },
    ('9600-N95', '9600-N95二合一', '查货'): {
        'standard_output': 1971,
        'standard_quality_rate': 0.99,
        'standard_rework_limit': 0.003,
        'standard_scrap_limit': 0.0005,
        'note': '9600-N95二合一查货'
    },
    ('9600-N95', '全自动贴片焊带机 焊头带/贴鼻夹等', '二合一'): {
        'standard_output': 1971,
        'standard_quality_rate': 0.99,
        'standard_rework_limit': 0.003,
        'standard_scrap_limit': 0.0005,
        'note': '全自动贴片焊带机二合一'
    },
    ('9600-N95', '二合一焊头带/贴鼻夹等', '二合一'): {
        'standard_output': 1971,
        'standard_quality_rate': 0.99,
        'standard_rework_limit': 0.003,
        'standard_scrap_limit': 0.0005,
        'note': '二合一焊头带/贴鼻夹等'
    },
    ('9600-N95', '斩台', '斩台'): {
        'standard_output': 12000,
        'standard_quality_rate': 0.99,
        'standard_rework_limit': 0.003,
        'standard_scrap_limit': 0.0005,
        'note': '斩台作业'
    },

    # ========================================
    # E101W 产品系列
    # ========================================
    ('E101W', '手工操作', '装彩盒'): {
        'standard_output': 20000,
        'standard_quality_rate': 0.985,
        'standard_rework_limit': 0.005,
        'standard_scrap_limit': 0.001,
        'note': '批量作业'
    },
    ('E101W', '', '装彩盒'): {
        'standard_output': 20000,
        'standard_quality_rate': 0.985,
        'standard_rework_limit': 0.005,
        'standard_scrap_limit': 0.001,
        'note': '装彩盒作业'
    },
    ('E101W', '手工操作', '装箱'): {
        'standard_output': 35000,
        'standard_quality_rate': 0.985,
        'standard_rework_limit': 0.005,
        'standard_scrap_limit': 0.001,
        'note': '批量作业'
    },
    ('E101W', '', '装箱'): {
        'standard_output': 35000,
        'standard_quality_rate': 0.985,
        'standard_rework_limit': 0.005,
        'standard_scrap_limit': 0.001,
        'note': '装箱作业'
    },
    ('E101W', '', '返工收缩膜'): {
        'standard_output': 8000,
        'standard_quality_rate': 0.985,
        'standard_rework_limit': 0.005,
        'standard_scrap_limit': 0.001,
        'note': '返工收缩膜作业'
    },
    ('E101W', '', '包装过缩查货'): {
        'standard_output': 6000,
        'standard_quality_rate': 0.985,
        'standard_rework_limit': 0.005,
        'standard_scrap_limit': 0.001,
        'note': '包装过缩查货作业'
    },
    ('E101W', '', '开机'): {
        'standard_output': 18000,
        'standard_quality_rate': 0.985,
        'standard_rework_limit': 0.005,
        'standard_scrap_limit': 0.001,
        'note': '开机作业'
    },
    ('E101W', '', '包装过缩'): {
        'standard_output': 15000,
        'standard_quality_rate': 0.985,
        'standard_rework_limit': 0.005,
        'standard_scrap_limit': 0.001,
        'note': '包装过缩作业'
    },
    ('E101W', '过缩包装机', '包装过缩'): {
        'standard_output': 15000,
        'standard_quality_rate': 0.985,
        'standard_rework_limit': 0.005,
        'standard_scrap_limit': 0.001,
        'note': '过缩包装机作业'
    },
    ('E101W', '过胶收缩包装机', '包装过缩'): {
        'standard_output': 15000,
        'standard_quality_rate': 0.985,
        'standard_rework_limit': 0.005,
        'standard_scrap_limit': 0.001,
        'note': '过胶收缩包装机作业'
    },
    ('E101W', '', '包装点数'): {
        'standard_output': 12000,
        'standard_quality_rate': 0.985,
        'standard_rework_limit': 0.005,
        'standard_scrap_limit': 0.001,
        'note': '包装点数作业'
    },
    ('E101W', '', '杯检'): {
        'standard_output': 8000,
        'standard_quality_rate': 0.985,
        'standard_rework_limit': 0.005,
        'standard_scrap_limit': 0.001,
        'note': '杯检作业'
    },
    ('E101W', '', '开机'): {
        'standard_output': 18000,
        'standard_quality_rate': 0.985,
        'standard_rework_limit': 0.005,
        'standard_scrap_limit': 0.001,
        'note': '开机作业'
    },
    ('E101W', '', '斩台'): {
        'standard_output': 12000,
        'standard_quality_rate': 0.985,
        'standard_rework_limit': 0.005,
        'standard_scrap_limit': 0.001,
        'note': '斩台作业'
    },
    ('E101W', '全自动贴片焊带机 焊片/焊带/耳带等', '开机'): {
        'standard_output': 18000,
        'standard_quality_rate': 0.985,
        'standard_rework_limit': 0.005,
        'standard_scrap_limit': 0.001,
        'note': '全自动贴片焊带机开机'
    },
    ('E101W', '斩台', '斩台'): {
        'standard_output': 12000,
        'standard_quality_rate': 0.985,
        'standard_rework_limit': 0.005,
        'standard_scrap_limit': 0.001,
        'note': '斩台作业'
    },

    # ========================================
    # E103B 产品系列
    # ========================================
    ('E103B', '', '杯检'): {
        'standard_output': 8000,
        'standard_quality_rate': 0.985,
        'standard_rework_limit': 0.005,
        'standard_scrap_limit': 0.001,
        'note': '杯检作业'
    },
    ('E103B', '', '查货'): {
        'standard_output': 6000,
        'standard_quality_rate': 0.985,
        'standard_rework_limit': 0.005,
        'standard_scrap_limit': 0.001,
        'note': '查货作业'
    },
    ('E103B', '', '点数'): {
        'standard_output': 10000,
        'standard_quality_rate': 0.985,
        'standard_rework_limit': 0.005,
        'standard_scrap_limit': 0.001,
        'note': '点数作业'
    },
    ('E103B', '', '返工织带'): {
        'standard_output': 2000,
        'standard_quality_rate': 0.985,
        'standard_rework_limit': 0.005,
        'standard_scrap_limit': 0.001,
        'note': '返工织带作业'
    },
    ('E103B', '', '返工擦胶'): {
        'standard_output': 2000,
        'standard_quality_rate': 0.985,
        'standard_rework_limit': 0.005,
        'standard_scrap_limit': 0.001,
        'note': '返工擦胶作业'
    },
    ('E103B', '', '返工铝片'): {
        'standard_output': 1500,
        'standard_quality_rate': 0.985,
        'standard_rework_limit': 0.005,
        'standard_scrap_limit': 0.001,
        'note': '返工铝片作业'
    },
    ('E103B', '', '装箱'): {
        'standard_output': 30000,
        'standard_quality_rate': 0.985,
        'standard_rework_limit': 0.005,
        'standard_scrap_limit': 0.001,
        'note': '装箱作业'
    },
    ('E103B', '', '装胶袋'): {
        'standard_output': 15000,
        'standard_quality_rate': 0.985,
        'standard_rework_limit': 0.005,
        'standard_scrap_limit': 0.001,
        'note': '装胶袋作业'
    },
    ('E103B', '', '包装'): {
        'standard_output': 12000,
        'standard_quality_rate': 0.985,
        'standard_rework_limit': 0.005,
        'standard_scrap_limit': 0.001,
        'note': '包装作业'
    },
    ('E103B', '', '包装点数'): {
        'standard_output': 10000,
        'standard_quality_rate': 0.985,
        'standard_rework_limit': 0.005,
        'standard_scrap_limit': 0.001,
        'note': '包装点数作业'
    },
    ('E103B', '', '轧针机'): {
        'standard_output': 8000,
        'standard_quality_rate': 0.985,
        'standard_rework_limit': 0.005,
        'standard_scrap_limit': 0.001,
        'note': '轧针机作业'
    },
    ('E103B', '斩台', '斩台'): {
        'standard_output': 12000,
        'standard_quality_rate': 0.985,
        'standard_rework_limit': 0.005,
        'standard_scrap_limit': 0.001,
        'note': '斩台作业'
    },
    ('E103B', '手动更换铝片机', '返工铝片'): {
        'standard_output': 1500,
        'standard_quality_rate': 0.985,
        'standard_rework_limit': 0.005,
        'standard_scrap_limit': 0.001,
        'note': '手动更换铝片机作业'
    },
    ('E103B', '手动更换耳带机', '返工织带'): {
        'standard_output': 2000,
        'standard_quality_rate': 0.985,
        'standard_rework_limit': 0.005,
        'standard_scrap_limit': 0.001,
        'note': '手动更换耳带机作业'
    },
    ('E103B', '手动更换铝片机', '手动换铝片后'): {
        'standard_output': 1500,
        'standard_quality_rate': 0.985,
        'standard_rework_limit': 0.005,
        'standard_scrap_limit': 0.001,
        'note': '手动换铝片后作业'
    },
    ('E103B', '全自动贴片焊带机 焊片/焊带/耳带等', '开机'): {
        'standard_output': 18000,
        'standard_quality_rate': 0.985,
        'standard_rework_limit': 0.005,
        'standard_scrap_limit': 0.001,
        'note': '全自动贴片焊带机开机'
    },
    ('E103B', '全自动成型机', '全自动成型'): {
        'standard_output': 15000,
        'standard_quality_rate': 0.985,
        'standard_rework_limit': 0.005,
        'standard_scrap_limit': 0.001,
        'note': '全自动成型机作业'
    },
    ('E103B', '全自动贴片焊带机 焊片/焊带/耳带等', '开机'): {
        'standard_output': 18000,
        'standard_quality_rate': 0.985,
        'standard_rework_limit': 0.005,
        'standard_scrap_limit': 0.001,
        'note': '全自动贴片焊带机开机'
    },
    ('E103B', '全自动贴片焊带机 焊片/焊带/耳带等', '查货'): {
        'standard_output': 8000,
        'standard_quality_rate': 0.985,
        'standard_rework_limit': 0.005,
        'standard_scrap_limit': 0.001,
        'note': '全自动贴片焊带机查货'
    },
    ('E103B', '全自动贴片焊带机 焊片/焊带/耳带等', '全自动成型'): {
        'standard_output': 4500,
        'standard_quality_rate': 0.985,
        'standard_rework_limit': 0.005,
        'standard_scrap_limit': 0.001,
        'note': '全自动贴片焊带机全自动成型'
    },
    ('E103B', '全自动贴片焊带机 焊片/焊带/耳带等', '查货'): {
        'standard_output': 8000,
        'standard_quality_rate': 0.985,
        'standard_rework_limit': 0.005,
        'standard_scrap_limit': 0.001,
        'note': '全自动贴片焊带机查货'
    },
    ('E103B', '全自动贴片焊带机 焊片/焊带/耳带等', '全自动成型'): {
        'standard_output': 4500,
        'standard_quality_rate': 0.985,
        'standard_rework_limit': 0.005,
        'standard_scrap_limit': 0.001,
        'note': '全自动贴片焊带机全自动成型'
    },

    # ========================================
    # A103B 产品系列
    # ========================================
    ('A103B', '', '杯检'): {
        'standard_output': 8000,
        'standard_quality_rate': 0.985,
        'standard_rework_limit': 0.005,
        'standard_scrap_limit': 0.001,
        'note': '杯检作业'
    },
    ('A103B', '', '查货'): {
        'standard_output': 6000,
        'standard_quality_rate': 0.985,
        'standard_rework_limit': 0.005,
        'standard_scrap_limit': 0.001,
        'note': '查货作业'
    },
    ('A103B', '', '点数'): {
        'standard_output': 10000,
        'standard_quality_rate': 0.985,
        'standard_rework_limit': 0.005,
        'standard_scrap_limit': 0.001,
        'note': '点数作业'
    },
    ('A103B', '', '返工织带'): {
        'standard_output': 2000,
        'standard_quality_rate': 0.985,
        'standard_rework_limit': 0.005,
        'standard_scrap_limit': 0.001,
        'note': '返工织带作业'
    },
    ('A103B', '', '全自动成型'): {
        'standard_output': 15000,
        'standard_quality_rate': 0.985,
        'standard_rework_limit': 0.005,
        'standard_scrap_limit': 0.001,
        'note': '全自动成型作业'
    },
    ('A103B', '', '开机'): {
        'standard_output': 18000,
        'standard_quality_rate': 0.985,
        'standard_rework_limit': 0.005,
        'standard_scrap_limit': 0.001,
        'note': '开机作业'
    },
    ('A103B', '', '开机+查货'): {
        'standard_output': 10000,
        'standard_quality_rate': 0.985,
        'standard_rework_limit': 0.005,
        'standard_scrap_limit': 0.001,
        'note': '开机+查货作业'
    },
    ('A103B', '', '斩台'): {
        'standard_output': 12000,
        'standard_quality_rate': 0.985,
        'standard_rework_limit': 0.005,
        'standard_scrap_limit': 0.001,
        'note': '斩台作业'
    },
    ('A103B', '', '轧针机'): {
        'standard_output': 8000,
        'standard_quality_rate': 0.985,
        'standard_rework_limit': 0.005,
        'standard_scrap_limit': 0.001,
        'note': '轧针机作业'
    },
    ('A103B', '全自动成型机', '全自动成型'): {
        'standard_output': 15000,
        'standard_quality_rate': 0.985,
        'standard_rework_limit': 0.005,
        'standard_scrap_limit': 0.001,
        'note': '全自动成型机作业'
    },
    ('A103B', '全自动贴片焊带机 焊片/焊带/耳带等', '开机'): {
        'standard_output': 18000,
        'standard_quality_rate': 0.985,
        'standard_rework_limit': 0.005,
        'standard_scrap_limit': 0.001,
        'note': '全自动贴片焊带机开机'
    },
    ('A103B', '全自动贴片焊带机 焊片/焊带/耳带等', '开机+查货'): {
        'standard_output': 10000,
        'standard_quality_rate': 0.985,
        'standard_rework_limit': 0.005,
        'standard_scrap_limit': 0.001,
        'note': '全自动贴片焊带机开机+查货'
    },
    ('A103B', '斩台', '斩台'): {
        'standard_output': 12000,
        'standard_quality_rate': 0.985,
        'standard_rework_limit': 0.005,
        'standard_scrap_limit': 0.001,
        'note': '斩台作业'
    },
    ('A103B', '手动更换耳带机', '返工织带'): {
        'standard_output': 2000,
        'standard_quality_rate': 0.985,
        'standard_rework_limit': 0.005,
        'standard_scrap_limit': 0.001,
        'note': '手动更换耳带机作业'
    },
    ('A103B', '轧针机', '轧针机'): {
        'standard_output': 8000,
        'standard_quality_rate': 0.985,
        'standard_rework_limit': 0.005,
        'standard_scrap_limit': 0.001,
        'note': '轧针机作业'
    },

    # ========================================
    # A铝片 产品系列
    # ========================================
    ('A铝片', '冲床机', '冲铝片'): {
        'standard_output': 5000,
        'standard_quality_rate': 0.98,
        'standard_rework_limit': 0.008,
        'standard_scrap_limit': 0.002,
        'note': '冲铝片作业'
    },
    ('A铝片', '过胶机', '过胶'): {
        'standard_output': 4000,
        'standard_quality_rate': 0.98,
        'standard_rework_limit': 0.008,
        'standard_scrap_limit': 0.002,
        'note': '过胶作业'
    },

    # ========================================
    # E铝片 产品系列
    # ========================================
    ('E铝片', '冲床机', '冲铝片'): {
        'standard_output': 5000,
        'standard_quality_rate': 0.98,
        'standard_rework_limit': 0.008,
        'standard_scrap_limit': 0.002,
        'note': '冲铝片作业'
    },
    ('E铝片', '过胶机', '过胶'): {
        'standard_output': 4000,
        'standard_quality_rate': 0.98,
        'standard_rework_limit': 0.008,
        'standard_scrap_limit': 0.002,
        'note': '过胶作业'
    },

    # ========================================
    # 缺失工站配置补充
    # ========================================
    ('9600-N95', '9600-N95二合一', '查货'): {
        'standard_output': 5000,
        'standard_quality_rate': 0.99,
        'standard_rework_limit': 0.003,
        'standard_scrap_limit': 0.0005,
        'note': '二合一查货'
    },
    ('9600-N95', '全自动贴片焊带机 焊头带/贴鼻夹等', '二合一'): {
        'standard_output': 5000,
        'standard_quality_rate': 0.99,
        'standard_rework_limit': 0.003,
        'standard_scrap_limit': 0.0005,
        'note': '全自动贴片焊带机二合一'
    },
    ('9600-N95', '全自动贴片焊带机 焊头带/贴鼻夹等', '开机'): {
        'standard_output': 5000,
        'standard_quality_rate': 0.99,
        'standard_rework_limit': 0.003,
        'standard_scrap_limit': 0.0005,
        'note': '全自动贴片焊带机开机'
    },
    ('9600-N95', '二合一焊头带/贴鼻夹等', '查货'): {
        'standard_output': 5000,
        'standard_quality_rate': 0.99,
        'standard_rework_limit': 0.003,
        'standard_scrap_limit': 0.0005,
        'note': '二合一焊头带查货'
    },
    ('9600-N95', '二合一焊头带/贴鼻夹等', '开机'): {
        'standard_output': 5000,
        'standard_quality_rate': 0.99,
        'standard_rework_limit': 0.003,
        'standard_scrap_limit': 0.0005,
        'note': '二合一焊头带开机'
    },
    ('E101W', '', '开机'): {
        'standard_output': 5000,
        'standard_quality_rate': 0.985,
        'standard_rework_limit': 0.005,
        'standard_scrap_limit': 0.001,
        'note': 'E101W开机作业'
    },
    ('E103B', '全自动贴片焊带机 焊片/焊带/耳带等', '全自动成型'): {
        'standard_output': 4000,
        'standard_quality_rate': 0.985,
        'standard_rework_limit': 0.005,
        'standard_scrap_limit': 0.001,
        'note': 'E103B全自动成型'
    },

}

# KPI指标权重配置
KPI_WEIGHTS = {
    'working_hours_rate': 0.10,   # 工时达成率 10%
    'quality_rate': 0.30,          # 良品达成率 30%
    'productivity_rate': 0.30,     # 人时产出达成率 30%
    'rework_rate': 0.15,           # 返工率控制 15%
    'scrap_rate': 0.15             # 报废率控制 15%
}

# KPI等级标准配置
GRADE_THRESHOLDS = {
    'working_hours_rate': {  # 工时达成率 - 越高越好
        '甲': (100, float('inf')),   # ≥100%
        '乙': (95, 99.99),           # 95%~99%
        '丙': (90, 94.99),           # 90%~94%
        '丁': (0, 89.99)             # <90%
    },
    'quality_rate': {  # 良品达成率 - 越高越好
        '甲': (100, float('inf')),   # ≥100%
        '乙': (98, 99.99),           # 98%~99%
        '丙': (95, 97.99),           # 95%~97%
        '丁': (0, 94.99)             # <95%
    },
    'productivity_rate': {  # 人时产出达成率 - 越高越好
        '甲': (100, float('inf')),   # ≥100%
        '乙': (90, 99.99),           # 90%~99%
        '丙': (80, 89.99),           # 80%~89%
        '丁': (0, 79.99)             # <80%
    },
    'rework_rate': {  # 返工率控制 - 越低越好
        '甲': (0, 0.5),              # ≤0.5%
        '乙': (0.51, 1.0),           # 0.6%~1%
        '丙': (1.01, 2.0),           # 1.1%~2%
        '丁': (2.01, float('inf'))   # >2%
    },
    'scrap_rate': {  # 报废率控制 - 越低越好
        '甲': (0, 0.1),              # ≤0.1%
        '乙': (0.11, 0.3),           # 0.11%~0.3%
        '丙': (0.31, 0.5),           # 0.31%~0.5%
        '丁': (0.51, float('inf'))   # >0.5%
    }
}

# 等级得分
GRADE_SCORES = {
    '甲': 10,
    '乙': 8,
    '丙': 6,
    '丁': 4
}

# 月度标准工时配置
MONTHLY_STANDARD_HOURS = 22 * 8  # 22天 × 8小时 = 176小时

# KPI指标名称映射
KPI_NAMES = {
    'working_hours_rate': '工时达成率',
    'quality_rate': '良品达成率',
    'productivity_rate': '人时产出达成率',
    'rework_rate': '返工率控制',
    'scrap_rate': '报废率控制'
}
